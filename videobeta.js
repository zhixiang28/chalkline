// Beta from a video: follows the climber's hands and feet (pose tracking, on this device) and turns each place a limb rests into a move.
// The video itself is never uploaded: only a still of the wall and the list of moves are kept.
import React, { useState, useRef } from "react";
import { Film, X } from "lucide-react";
import { tracksToMoves, medianImage } from "./videotrack.js";

const h = React.createElement;
const MP_VERSION = "0.10.14";
const sources = () => {
  const c = (typeof window !== "undefined" && window.CHALKLINE_MP) || {};
  return {
    lib: c.lib || `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`,
    wasm: c.wasm || `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`,
    model: c.model || "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
  };
};

let trackerPromise = null;
function getTracker() {
  if (!trackerPromise) {
    trackerPromise = (async () => {
      const s = sources();
      const { FilesetResolver, PoseLandmarker } = await import(/* @vite-ignore */ s.lib);
      const files = await FilesetResolver.forVisionTasks(s.wasm);
      const make = (delegate) => PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: s.model, delegate }, runningMode: "VIDEO", numPoses: 1 });
      try { return await make("GPU"); } catch { return make("CPU"); }
    })().catch((e) => { trackerPromise = null; throw e; });
  }
  return trackerPromise;
}

const once = (el, ev, ms = 8000) => new Promise((res, rej) => {
  const t = setTimeout(() => { el.removeEventListener(ev, ok); rej(new Error(`video ${ev} timed out`)); }, ms);
  const ok = () => { clearTimeout(t); res(); };
  el.addEventListener(ev, ok, { once: true });
});

// file: a video File. onProgress(fraction, message). isCancelled(): boolean. Resolves { photo, beta, frames, detected }.
export async function analyzeClimbVideo(file, onProgress = () => {}, isCancelled = () => false) {
  onProgress(0, "Loading the movement tracker…");
  const tracker = await getTracker();
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = url;
  try {
    await once(video, "loadedmetadata", 15000);
    if (!isFinite(video.duration)) { video.currentTime = 1e7; await once(video, "seeked").catch(() => {}); }
    const dur = Math.min(isFinite(video.duration) ? video.duration : 60, 180);
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) throw new Error("This video can't be read on this device.");
    const fps = Math.max(2, Math.min(8, 300 / dur)), n = Math.max(3, Math.floor(dur * fps));
    const small = document.createElement("canvas"); small.width = 480; small.height = Math.round((480 * vh) / vw);
    const sctx = small.getContext("2d", { willReadFrequently: false });
    const pw = Math.min(900, vw), ph = Math.round((pw * vh) / vw);
    const big = document.createElement("canvas"); big.width = pw; big.height = ph;
    const bctx = big.getContext("2d", { willReadFrequently: true });
    const keepEvery = Math.max(1, Math.floor(n / 9)), stills = [];
    const frames = [];
    let lastTs = -1;
    for (let i = 0; i < n; i++) {
      if (isCancelled()) throw new Error("cancelled");
      const t = Math.min(dur - 0.05, (i + 0.5) / fps);
      video.currentTime = t;
      await once(video, "seeked");
      sctx.drawImage(video, 0, 0, small.width, small.height);
      const ts = Math.max(lastTs + 1, Math.round(t * 1000)); lastTs = ts;
      const res = tracker.detectForVideo(small, ts);
      frames.push({ t, lm: res && res.landmarks && res.landmarks[0] ? res.landmarks[0] : null });
      if (i % keepEvery === 0 && stills.length < 9) { bctx.drawImage(video, 0, 0, pw, ph); stills.push(bctx.getImageData(0, 0, pw, ph).data); }
      onProgress(0.05 + 0.85 * ((i + 1) / n), "Following your hands and feet…");
      if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    onProgress(0.92, "Building the wall photo…");
    await new Promise((r) => setTimeout(r, 0));
    const out = bctx.createImageData(pw, ph);
    out.data.set(stills.length >= 3 ? medianImage(stills, pw, ph) : stills[0]);
    bctx.putImageData(out, 0, 0);
    const photo = big.toDataURL("image/jpeg", 0.85);
    const r = tracksToMoves(frames, vh / vw);
    onProgress(1, "Done");
    return { photo, beta: r.moves.length ? { v: 1, color: null, moves: r.moves } : null, frames: frames.length, detected: r.detected };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src"); video.load();
  }
}

// Button + progress sheet. onResult({ photo, beta }) is called once the moves are ready.
export function VideoBetaButton({ onResult, label = "Make the beta from a video", className = "cl-photo-btn cl-vb-btn" }) {
  const [st, setSt] = useState(null); // { p, msg } | { error } | { done, moves }
  const cancel = useRef(false);
  const inputId = useRef("cl-vb-" + Math.random().toString(36).slice(2, 8));
  const run = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    cancel.current = false;
    setSt({ p: 0, msg: "Loading the movement tracker…" });
    try {
      const r = await analyzeClimbVideo(f, (p, msg) => setSt({ p, msg }), () => cancel.current);
      if (!r.beta) { setSt({ error: r.detected < 3 ? "I couldn't see a climber in this video. Film from behind with the whole body in the frame and the phone held still." : "I saw the climber but no clear holds: the hands and feet never rested long enough. Try a video with the phone held still." }); return; }
      onResult({ photo: r.photo, beta: r.beta });
      setSt({ done: true, moves: r.beta.moves.length });
    } catch (err) {
      if (err && err.message === "cancelled") { setSt(null); return; }
      setSt({ error: navigator.onLine === false ? "You're offline. The movement tracker needs a connection the first time." : "Couldn't read this video here. Try a shorter clip or another file." });
    }
  };
  return h(React.Fragment, null,
    h("input", { type: "file", accept: "video/*", id: inputId.current, className: "cl-file-hidden", onChange: run }),
    h("label", { htmlFor: inputId.current, className }, h(Film, { size: 16 }), " ", label),
    st && h("div", { className: "cl-sheet-backdrop cl-layer-top" }, h("div", { className: "cl-sheet cl-vb-sheet", role: "dialog", "aria-modal": "true" },
      h("div", { className: "cl-sheet-handle" }),
      st.error ? h(React.Fragment, null, h("p", { className: "cl-sheet-title" }, "No beta from this video"), h("p", { className: "cl-vb-msg" }, st.error), h("button", { type: "button", className: "cl-btn-primary", onClick: () => setSt(null) }, "OK"))
      : st.done ? h(React.Fragment, null, h("p", { className: "cl-sheet-title" }, `Found ${st.moves} moves`), h("p", { className: "cl-vb-msg" }, "The wall photo and the moves are in. Check them in the beta editor: tracking can miss a hold or add one while you stand on the floor."), h("button", { type: "button", className: "cl-btn-primary", onClick: () => setSt(null) }, "OK"))
      : h(React.Fragment, null, h("p", { className: "cl-sheet-title" }, "Reading your video"), h("p", { className: "cl-vb-msg" }, st.msg), h("div", { className: "cl-vb-bar" }, h("i", { style: { width: `${Math.round((st.p || 0) * 100)}%` } })), h("p", { className: "cl-hint" }, "The video stays on this phone. Only a still of the wall and the moves are saved."), h("button", { type: "button", className: "cl-btn-ghost", onClick: () => { cancel.current = true; } }, "Cancel")))));
}
