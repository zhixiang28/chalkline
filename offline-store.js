// Offline-first wrapper for the shared (Supabase) storage used by Chalkline.
// - Every shared read/write is mirrored into IndexedDB, so the app keeps working with no signal.
// - Writes that fail because the network is down are queued in an outbox and replayed when the
//   connection returns (last write wins).
const DB_NAME = "chalkline-offline";
const STORE = "kv";
const OUTBOX_KEY = "meta:outbox";
const FAILED_KEY = "meta:failed";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = null;
function db() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then((r) => { result = r; }).catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const req2p = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const kvGet = (k) => tx("readonly", (s) => req2p(s.get(k)));
const kvPut = (k, v) => tx("readwrite", (s) => { s.put(v, k); });
const kvDel = (k) => tx("readwrite", (s) => { s.delete(k); });
const kvKeys = () => tx("readonly", (s) => req2p(s.getAllKeys()));

export function isNetworkError(err) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = String((err && (err.message || err.details)) || err || "");
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|network error/i.test(msg);
}

// network: still offline, retry later · server: temporary 5xx/429, retry later
// auth: signed out / expired token, keep the change until the user is signed in again
// permanent: the server refused this change itself (kept aside, never silently deleted)
export function classifyError(err, signedIn) {
  if (isNetworkError(err)) return "network";
  const status = Number(err && (err.status || err.statusCode)) || 0;
  const code = String((err && err.code) || "");
  const msg = String((err && (err.message || err.details)) || err || "");
  if (status >= 500 || status === 408 || status === 429 || /timeout|timed out/i.test(msg)) return "server";
  if (status === 401 || code === "PGRST301" || /jwt|not authenticated|invalid token|token.*expired/i.test(msg)) return "auth";
  if (status === 403 || code === "42501" || /row-level security|permission denied/i.test(msg)) return signedIn === false ? "auth" : "permanent";
  return "permanent";
}

export function createOfflineStore(raw, { onChange, hasSession } = {}) {
  let outbox = null;
  let failed = [];
  let authBlocked = false;
  let flushing = null;
  const listeners = new Set();
  if (onChange) listeners.add(onChange);
  const emit = () => listeners.forEach((fn) => { try { fn(api.pendingCount()); } catch {} });

  async function loadOutbox() {
    if (outbox) return outbox;
    try { outbox = (await kvGet(OUTBOX_KEY)) || []; } catch { outbox = []; }
    try { failed = (await kvGet(FAILED_KEY)) || []; } catch { failed = []; }
    return outbox;
  }
  async function saveOutbox() {
    try { await kvPut(OUTBOX_KEY, outbox); await kvPut(FAILED_KEY, failed); } catch {}
    emit();
  }
  async function enqueue(item) {
    await loadOutbox();
    outbox = outbox.filter((o) => o.key !== item.key);
    outbox.push(item);
    await saveOutbox();
  }
  // a failed write is kept for later when the cause is temporary (offline, server hiccup, signed out)
  async function queueable(err) {
    let signedIn;
    if (hasSession) { try { signedIn = await hasSession(); } catch {} }
    const kind = classifyError(err, signedIn);
    if (kind === "auth") authBlocked = true;
    return kind !== "permanent";
  }
  const pendingFor = (key) => (outbox || []).find((o) => o.key === key);

  async function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      await loadOutbox();
      while (outbox.length > 0) {
        const item = outbox[0];
        try {
          if (item.op === "set") await raw.set(item.key, item.value, true);
          else await raw.delete(item.key, true);
          authBlocked = false;
        } catch (err) {
          let signedIn;
          if (hasSession) { try { signedIn = await hasSession(); } catch { signedIn = undefined; } }
          const kind = classifyError(err, signedIn);
          if (kind === "network" || kind === "server") break; // try again later
          if (kind === "auth") { authBlocked = true; emit(); break; } // keep everything until signed in again
          console.error("Chalkline: change was refused by the server", item.key, err);
          failed.push({ ...item, reason: String((err && err.message) || err || "refused").slice(0, 200), at: Date.now() });
        }
        outbox.shift();
        await saveOutbox();
      }
    })().finally(() => { flushing = null; });
    return flushing;
  }

  const api = {
    pendingCount: () => (outbox ? outbox.length : 0),
    failedCount: () => failed.length,
    needsSignIn: () => authBlocked && !!(outbox && outbox.length),
    async retryFailed() { await loadOutbox(); outbox.push(...failed.map(({ reason, at, ...it }) => it)); failed = []; await saveOutbox(); return flush(); },
    async discardFailed() { failed = []; await saveOutbox(); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    flush,
    async init() { await loadOutbox(); emit(); if (outbox.length) flush(); },

    async get(key, shared) {
      if (!shared) return raw.get(key, shared);
      await loadOutbox();
      if (outbox.length && navigator.onLine !== false) await flush();
      const pending = pendingFor(key);
      if (pending) return pending.op === "set" ? { key, value: pending.value, shared: true } : null;
      try {
        const r = await raw.get(key, shared);
        if (r) await kvPut("shared:" + key, r.value).catch(() => {});
        else await kvDel("shared:" + key).catch(() => {});
        return r;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        const v = await kvGet("shared:" + key).catch(() => undefined);
        return v === undefined ? null : { key, value: v, shared: true };
      }
    },

    async set(key, value, shared) {
      if (!shared) return raw.set(key, value, shared);
      await loadOutbox();
      await kvPut("shared:" + key, value).catch(() => {});
      if (outbox.length && navigator.onLine !== false) await flush();
      if (pendingFor(key) || navigator.onLine === false) {
        await enqueue({ op: "set", key, value });
        return { key, value, shared: true, queued: true };
      }
      try {
        return await raw.set(key, value, shared);
      } catch (err) {
        if (!(await queueable(err))) throw err;
        await enqueue({ op: "set", key, value });
        return { key, value, shared: true, queued: true };
      }
    },

    async delete(key, shared) {
      if (!shared) return raw.delete(key, shared);
      await loadOutbox();
      await kvDel("shared:" + key).catch(() => {});
      if (outbox.length && navigator.onLine !== false) await flush();
      if (pendingFor(key) || navigator.onLine === false) {
        await enqueue({ op: "delete", key });
        return { key, deleted: true, shared: true, queued: true };
      }
      try {
        return await raw.delete(key, shared);
      } catch (err) {
        if (!(await queueable(err))) throw err;
        await enqueue({ op: "delete", key });
        return { key, deleted: true, shared: true, queued: true };
      }
    },

    async list(prefix, shared) {
      if (!shared) return raw.list(prefix, shared);
      await loadOutbox();
      if (outbox.length && navigator.onLine !== false) await flush();
      const apply = (keys) => {
        const set = new Set(keys);
        outbox.forEach((o) => { if (o.key.startsWith(prefix || "")) { if (o.op === "set") set.add(o.key); else set.delete(o.key); } });
        return [...set];
      };
      try {
        const r = await raw.list(prefix, shared);
        return { ...r, keys: apply(r.keys || []) };
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        const all = (await kvKeys().catch(() => [])).filter((k) => typeof k === "string" && k.startsWith("shared:")).map((k) => k.slice(7));
        return { keys: apply(all.filter((k) => k.startsWith(prefix || ""))), prefix, shared: true };
      }
    },
  };
  return api;
}
