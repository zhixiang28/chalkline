// Beta builder + player: mark which hold each hand/foot uses, in order, and replay it step by step.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Play, Pause, Undo2, Trash2, Check, ChevronLeft, ChevronRight, ZoomIn, Sparkles, X, PersonStanding, Link2, Film, Share2, Download, SlidersHorizontal, Pencil } from "lucide-react";
import { solvePose, poseLines } from "./stickman.js";
import { TechniquePicker, TechniqueHelpButton, TECH_BY_ID } from "./technique.js";
import { toImageData, detectHolds, growHoldAt, nameColor, rgb2hsv, COLOR_HEX } from "./holds.js";

const h = React.createElement;

export const LIMBS = {
  LH: { label: "Left hand", short: "L", kind: "hand", color: "#38BDF8", ink: "#06283A" },
  RH: { label: "Right hand", short: "R", kind: "hand", color: "#FF6B35", ink: "#3A1204" },
  LF: { label: "Left foot", short: "L", kind: "foot", color: "#A78BFA", ink: "#1D1040" },
  RF: { label: "Right foot", short: "R", kind: "foot", color: "#FBBF24", ink: "#3A2A04" },
};
const NEXT_LIMB = { LH: "RH", RH: "LH", LF: "RF", RF: "LF" };
const rid = () => Math.random().toString(36).slice(2, 9);

export const hasBeta = (b) => !!(b && b.moves && b.moves.length);

// moves flagged `together` happen in the same step as the previous move (e.g. matching both hands on one hold)
// - the starting position (the first move of each limb) is one step
// - letting a limb go (free) is a step like any other (use "same step" to group it with a move)
export function groupMoves(moves) {
  const list = (moves || []).map((m, i) => ({ ...m, idx: i }));
  const groups = [];
  const seen = new Set();
  let start = 0;
  while (start < list.length && !seen.has(list[start].limb)) { seen.add(list[start].limb); start++; }
  if (start) groups.push(list.slice(0, start));
  list.slice(start).forEach((m, k) => {
    if (k === 0 || !m.together) groups.push([]);
    groups[groups.length - 1].push(m);
  });
  return groups.map((g) => g.slice().sort((a, c) => a.idx - c.idx));
}
// a step shares one technique (e.g. a dyno throws both hands together)
export const stepTech = (g) => { const m = (g || []).find((x) => x.tech && TECH_BY_ID[x.tech]); return m ? m.tech : null; };
export const stepOfMove = (moves) => { const map = []; groupMoves(moves).forEach((g, gi) => g.forEach((m) => { map[m.idx] = gi + 1; })); return map; };

// where every limb is after `step` steps
export function positionsAt(moves, step) {
  const pos = {};
  groupMoves(moves).slice(0, step).forEach((g, gi) => g.forEach((m) => { if (m.free) delete pos[m.limb]; else pos[m.limb] = { ...m, gi }; }));
  return pos;
}
// limbs that were let go (off the wall) after `step` steps, with the direction they point (-1 left, 0 hang, 1 right)
export function freeAt(moves, step) {
  const fr = {};
  groupMoves(moves).slice(0, step).forEach((g) => g.forEach((m) => { if (m.free) fr[m.limb] = m.dir || 0; else delete fr[m.limb]; }));
  return fr;
}

// markers that sit on (almost) the same spot are nudged apart so both stay visible
function spreadOffsets(items, asp) {
  const out = {};
  const used = new Set();
  items.forEach((a, i) => {
    if (used.has(i)) return;
    const cluster = [i];
    items.forEach((b, j) => { if (j !== i && !used.has(j) && Math.hypot(a.x - b.x, (a.y - b.y) * asp) < 4) cluster.push(j); });
    cluster.forEach((j) => used.add(j));
    const n = cluster.length;
    const spots = n === 1 ? [[0, 0]] : n === 2 ? [[-2.1, 0], [2.1, 0]] : n === 3 ? [[-2.3, 1], [2.3, 1], [0, -2]] : [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.9], [2.2, 1.9]];
    cluster.forEach((j, k) => { const sp = spots[k] || [0, 0]; out[items[j].key] = { dx: sp[0], dy: sp[1] / asp }; });
  });
  return out;
}

const bodyScale = (moves, asp) => {
  const groups = groupMoves(moves);
  let span = 0;
  for (let g = 1; g <= groups.length; g++) {
    const pos = positionsAt(moves, g);
    const keys = Object.keys(pos);
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) span = Math.max(span, Math.hypot(pos[keys[i]].x - pos[keys[j]].x, (pos[keys[i]].y - pos[keys[j]].y) * asp));
  }
  // a climber is about 3.3 body units long (feet to fingertips); make sure they can span the route
  return Math.max(9, Math.min(26, span / 3.1));
};

// one body size for the whole animation: the chosen size, but never smaller than needed to reach every hold without stretching
export function stickScale(moves, asp, build) {
  const bd = { size: 0.75, arm: 1, leg: 1, torso: 1, ...(build || {}) };
  const steps = groupMoves(moves).length;
  let u = bodyScale(moves, asp) * bd.size;
  for (let tries = 0; tries < 14; tries++) {
    let bad = false;
    for (let s = 1; s <= steps && !bad; s++) {
      const pos = positionsAt(moves, s), t = {};
      Object.keys(pos).forEach((k) => { t[k] = { x: pos[k].x, y: pos[k].y * asp }; });
      if (Object.keys(t).length && solvePose(t, u, { armK: bd.arm, legK: bd.leg, torsoK: bd.torso, freeDir: freeAt(moves, s) }).over) bad = true;
    }
    if (!bad) break;
    u *= 1.07;
  }
  return u;
}
export function poseAt(moves, step, asp, u, build, poses) {
  const bd = { size: 0.75, arm: 1, leg: 1, torso: 1, ...(build || {}) };
  const pos = positionsAt(moves, step), t = {};
  Object.keys(pos).forEach((k) => { t[k] = { x: pos[k].x, y: pos[k].y * asp }; });
  if (!Object.keys(t).length) return null;
  const opts = { armK: bd.arm, legK: bd.leg, torsoK: bd.torso, freeDir: freeAt(moves, step) };
  // hand-adjusted body for this step: core position and which way the elbows / knees bend
  const g = groupMoves(moves)[step - 1], ov = poses && g && poses[g[0].id];
  if (ov) {
    const cv = (p) => (p ? { x: p.x, y: p.y * asp } : void 0);
    if (ov.hip) opts.hip = cv(ov.hip);
    if (ov.elbows) opts.elbows = { L: cv(ov.elbows.L), R: cv(ov.elbows.R) };
    if (ov.knees) opts.knees = { L: cv(ov.knees.L), R: cv(ov.knees.R) };
  }
  return solvePose(t, u, opts);
}
export function lerpPose(A, B, e) {
  if (!A) return B;
  const out = { ...B };
  Object.keys(B).forEach((k) => {
    const a = A[k], v = B[k];
    if (v && typeof v === "object" && "x" in v && a && "x" in a) out[k] = { x: a.x + (v.x - a.x) * e, y: a.y + (v.y - a.y) * e };
    else if (typeof v === "number" && typeof a === "number") out[k] = a + (v - a) * e;
  });
  return out;
}

function Marker({ m, number, selected, active, small, off }) {
  const L = LIMBS[m.limb];
  return h("div", {
    className: `cl-beta-mk ${L.kind}${m.surf && m.surf !== "hold" ? " surf-" + m.surf : ""}${selected ? " selected" : ""}${active ? " active" : ""}${small ? " small" : ""}`,
    style: { left: `${m.x + (off ? off.dx : 0)}%`, top: `${m.y + (off ? off.dy : 0)}%`, background: L.color, color: L.ink },
  }, h("span", null, L.short), number != null && h("i", null, number));
}

function Trails({ moves, step, activeGroup }) {
  const groups = groupMoves(moves).slice(0, step);
  const hands = [];
  groups.forEach((g) => g.forEach((m) => { if (LIMBS[m.limb].kind === "hand" && !m.free) hands.push(m); }));
  const prev = {};
  const segs = [];
  groups.forEach((g, gi) => g.forEach((m) => { if (gi === activeGroup && prev[m.limb] && !m.free) segs.push({ a: prev[m.limb], b: m, color: LIMBS[m.limb].color }); prev[m.limb] = m.free ? null : m; }));
  groups.forEach((g, gi) => { if (gi !== activeGroup) g.forEach((m) => { prev[m.limb] = m.free ? null : m; }); });
  return h("svg", { className: "cl-beta-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none" },
    hands.length > 1 && h("polyline", { points: hands.map((m) => `${m.x},${m.y}`).join(" "), fill: "none", stroke: "rgba(255,255,255,0.55)", strokeWidth: 2, strokeDasharray: "4 3", vectorEffect: "non-scaling-stroke", strokeLinecap: "round", strokeLinejoin: "round" }),
    segs.map((sg, i) => h("line", { key: i, x1: sg.a.x, y1: sg.a.y, x2: sg.b.x, y2: sg.b.y, stroke: sg.color, strokeWidth: 3.5, vectorEffect: "non-scaling-stroke", strokeLinecap: "round" })));
}

export function BetaLegend() {
  return h("div", { className: "cl-beta-legend" }, Object.keys(LIMBS).map((k) => h("span", { key: k }, h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label)));
}

// ---------- stickman overlay ----------
// eases the stick figure from its last pose to the target one (joint to joint, so limbs never stretch on the way)
function usePoseTween(target, on, speed, instant) {
  const [pose, setPose] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!on) return undefined;
    if (!target) { setVisible(false); return undefined; } // before the first step: fade the figure out but keep its last pose
    setVisible(true);
    const from = ref.current;
    if (instant || !from) { ref.current = target; setPose(target); return undefined; }
    let raf = 0, t0 = 0;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const t = Math.min(1, (ts - t0) / (700 / (speed || 1))), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const next = lerpPose(from, target, e);
      ref.current = next; setPose(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, on, speed, instant]);
  return [pose, () => { ref.current = null; setPose(null); setVisible(false); }, visible];
}

function Stickman({ pose, asp, opacity, visible }) {
  const P = pose;
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  if (!P) return null;
  const L = poseLines(P);
  const col = (k) => LIMBS[k].color;
  const body = (key, d, w, c) => h("path", { key, d, fill: "none", stroke: c, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" });
  return h("svg", { className: "cl-beta-svg stick", style: { opacity: on && visible !== false ? (opacity == null ? 1 : opacity) : 0, transition: "opacity 0.7s ease" }, viewBox: `0 0 100 ${100 * asp}`, preserveAspectRatio: "none" },
    [["torso", L.torso, 2.4], ["sh", L.shoulders, 2], ["hp", L.hips, 2], ["LA", L.LA, 2], ["RA", L.RA, 2], ["LL", L.LL, 2.1], ["RL", L.RL, 2.1]].map(([k, d, w]) => body("o" + k, d, w + 1.6, "rgba(0,0,0,0.65)")),
    h("circle", { cx: P.head.x, cy: P.head.y, r: P.headR + 0.8, fill: "rgba(0,0,0,0.65)" }),
    body("torso", L.torso, 2.4, "#F2F0E9"), body("sh", L.shoulders, 2, "#F2F0E9"), body("hp", L.hips, 2, "#F2F0E9"),
    body("LA", L.LA, 2, col("LH")), body("RA", L.RA, 2, col("RH")), body("LL", L.LL, 2.1, col("LF")), body("RL", L.RL, 2.1, col("RF")),
    h("circle", { cx: P.head.x, cy: P.head.y, r: P.headR, fill: "#2A2D27", stroke: "#F2F0E9", strokeWidth: 1.5 }));
}

const DEFAULT_BUILD = { size: 0.75, arm: 1, leg: 1, torso: 1, opacity: 0.7 }; // only the size is adjustable; limb proportions stay fixed
function loadBuild() {
  try { const v = JSON.parse(localStorage.getItem("chalkline_build") || "null"); if (v && v.size) return { ...DEFAULT_BUILD, size: v.size, opacity: typeof v.opacity === "number" ? v.opacity : DEFAULT_BUILD.opacity }; } catch {}
  return DEFAULT_BUILD;
}
const SURFS = [["hold", "Hold"], ["volume", "Volume"], ["wall", "Wall"]];
function SurfacePicker({ value, onChange }) {
  return h("div", { className: "cl-beta-surf" }, h("span", null, "On a"), SURFS.map(([k, label]) => h("button", { key: k, type: "button", className: value === k ? "active" : "", onClick: () => onChange(k) }, label)));
}
const stepLabel = (g) => g.map((m) => LIMBS[m.limb].label).join(" + ");

// ---------- player (read-only, animated) ----------
export function BetaPlayer({ photo, beta, onShare, onSaveBeta, title, subtitle }) {
  const moves = (beta && beta.moves) || [];
  const groups = useMemo(() => groupMoves(moves), [moves]);
  const n = groups.length;
  const [step, setStep] = useState(Math.min(1, n)); // the preview opens on the starting position
  // the beta was edited: show the new version from its last step, drop the old pose and any old video
  const sig = useMemo(() => JSON.stringify(moves), [beta]);
  const sigRef = useRef(sig);
  useEffect(() => {
    if (sigRef.current === sig) return;
    sigRef.current = sig;
    setPlaying(false); setStep(Math.min(1, groupMoves(moves).length)); resetPose(); setVid(null);
  }, [sig]);
  const [playing, setPlaying] = useState(false);
  const [stick, setStick] = useState(false);
  const [asp, setAsp] = useState(1.33);
  const [build, setBuildState] = useState(loadBuild);
  const [tune, setTune] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [editing, setEditing] = useState(false);
  const [vid, setVid] = useState(null);
  useEffect(() => () => { if (vid && vid.url) URL.revokeObjectURL(vid.url); }, [vid && vid.url]);
  const makeVideo = async () => {
    setPlaying(false);
    setVid({ busy: true, p: 0 });
    try {
      const r = await recordBetaVideo({ photo, beta, title, subtitle, build, onProgress: (p) => setVid((v) => (v && v.busy ? { ...v, p } : v)) });
      setVid({ url: URL.createObjectURL(r.blob), blob: r.blob, ext: r.ext, type: r.type });
    } catch { setVid({ error: true }); }
  };
  const fileOf = () => new File([vid.blob], `${(title || "beta").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-beta.${vid.ext}`, { type: vid.type });
  const downloadVideo = () => { const a = document.createElement("a"); a.href = vid.url; a.download = fileOf().name; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const shareVideo = async () => {
    const f = fileOf();
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: title || "Climbing beta" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    downloadVideo();
  };
  const setBuild = (patch) => setBuildState((b0) => { const nb = { ...b0, ...patch }; try { localStorage.setItem("chalkline_build", JSON.stringify(nb)); } catch {} return nb; });
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setStep((s) => { if (s >= n) { setPlaying(false); return n; } return s + 1; }), 1300 / speed);
    return () => clearInterval(t);
  }, [playing, n, speed]);
  const pos = useMemo(() => positionsAt(moves, step), [moves, step]);
  const cur = step > 0 ? groups[step - 1] : null;
  const offs = useMemo(() => spreadOffsets(Object.keys(pos).map((k) => ({ key: k, x: pos[k].x, y: pos[k].y })), asp), [pos, asp]);
  // smooth movement of the stickman between steps (joint to joint, so limbs never stretch on the way)
  const u = useMemo(() => stickScale(moves, asp, build), [moves, asp, build]);
  const target = useMemo(() => poseAt(moves, step, asp, u, build, beta && beta.poses), [moves, step, asp, u, build, beta]);
  const [pose, resetPose, poseVisible] = usePoseTween(target, stick, speed);
  // play continues from the step you're on (from the start again once it has reached the end)
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (step >= n) setStep(0);
    setPlaying(true);
  };
  const SPEEDS = [0.5, 1, 2];
  const curTech = stepTech(cur);
  const stage = h("div", { className: "cl-beta-stage" },
    h("img", { src: photo, alt: "Wall with beta", draggable: false, onLoad: (e) => { if (e.target.naturalWidth) setAsp(e.target.naturalHeight / e.target.naturalWidth); } }),
    !stick && h(Trails, { moves, step, activeGroup: step - 1 }),
    stick && h(Stickman, { pose, asp, opacity: build.opacity, visible: poseVisible }),
    !stick && Object.keys(pos).map((k) => h(Marker, { key: k, m: pos[k], off: offs[k], active: pos[k].gi === step - 1 })),
    h("button", { type: "button", className: "cl-beta-tap", onClick: toggle, "aria-label": playing ? "Pause" : "Play" }, null),
    onSaveBeta && h("button", { type: "button", className: "cl-beta-editbtn", onClick: () => { setPlaying(false); setEditing(true); } }, h(Pencil, { size: 13 }), " Edit beta"),
    h("div", { className: "cl-beta-badge" }, step === 0 ? "Start" : `Step ${step}/${n}`, curTech ? h("em", null, TECH_BY_ID[curTech].name) : null),
    h("div", { className: "cl-beta-seg" },
      h("button", { type: "button", className: !stick ? "active" : "", onClick: () => setStick(false) }, "Holds"),
      h("button", { type: "button", className: stick ? "active" : "", onClick: () => setStick(true) }, h(PersonStanding, { size: 13 }), " Stickman")));
  const dots = n <= 14 ? h("div", { className: "cl-beta-dots" }, Array.from({ length: n + 1 }, (_, i) => h("button", { key: i, type: "button", className: i === step ? "active" : i < step ? "done" : "", onClick: () => { setPlaying(false); setStep(i); }, "aria-label": i === 0 ? "Start" : `Step ${i}` }, i === 0 ? "S" : i)))
    : h("input", { type: "range", className: "cl-beta-range", min: 0, max: n, value: step, onChange: (e) => { setPlaying(false); setStep(Number(e.target.value)); }, "aria-label": "Move" });
  const caption = h("div", { className: "cl-beta-card" }, cur ? h(React.Fragment, null,
    h("div", { className: "cl-beta-cardhead" }, h("b", null, `Step ${step}`), h("span", null, stepLabel(cur))),
    stepTech(cur) && h("div", { className: "cl-beta-mline" }, h("span", { className: "cl-beta-tech" }, TECH_BY_ID[stepTech(cur)].name, h(TechniqueHelpButton, { id: stepTech(cur) }))),
    cur.map((m) => h("div", { key: m.id, className: "cl-beta-mline" },
      h("span", { className: "cl-beta-chipc lim" }, h("i", { style: { background: LIMBS[m.limb].color } }), LIMBS[m.limb].label),
      m.free ? h("span", { className: "cl-beta-chipc" }, m.dir ? `free · out to the ${m.dir < 0 ? "left" : "right"}` : "free · hanging") : h(React.Fragment, null,
        m.surf && m.surf !== "hold" && h("span", { className: "cl-beta-chipc" }, m.surf === "wall" ? "on the wall" : "on a volume"),
        m.color && m.surf !== "wall" && h("span", { className: "cl-beta-chipc" }, h("i", { style: { background: COLOR_HEX[m.color] || "#888" } }), m.color, " hold")),
      m.note && h("p", null, m.note))))
    : h("span", { className: "cl-hint" }, "Press play, tap a step number, or tap the photo."));
  return h("div", { className: "cl-beta-player" },
    stage,
    h("div", { className: "cl-beta-controls" },
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }, "aria-label": "Previous step" }, h(ChevronLeft, { size: 20 })),
      h("button", { type: "button", className: "cl-beta-btn primary", onClick: toggle, "aria-label": playing ? "Pause" : "Play" }, playing ? h(Pause, { size: 22 }) : h(Play, { size: 22 })),
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.min(n, s + 1)); }, "aria-label": "Next step" }, h(ChevronRight, { size: 20 })),
      dots,
      h("button", { type: "button", className: "cl-beta-speed", onClick: () => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]), "aria-label": "Playback speed" }, `${speed}×`),
      stick && h("button", { type: "button", className: tune ? "cl-beta-btn on" : "cl-beta-btn", onClick: () => setTune((v) => !v), "aria-label": "Stickman size" }, h(SlidersHorizontal, { size: 17 }))),
    stick && tune && h("div", { className: "cl-beta-tunebox" }, h("label", { className: "cl-beta-tunerow" }, h("span", null, "Stickman size"), h("input", { type: "range", min: 0.3, max: 1.6, step: 0.05, value: build.size, onChange: (e) => setBuild({ size: Number(e.target.value) }) }), h("em", null, Math.round(build.size * 100) + "%")), h("label", { className: "cl-beta-tunerow" }, h("span", null, "Transparency"), h("input", { type: "range", min: 0.25, max: 1, step: 0.05, value: build.opacity, onChange: (e) => setBuild({ opacity: Number(e.target.value) }) }), h("em", null, Math.round((1 - build.opacity) * 100) + "%")), h("button", { type: "button", className: "cl-beta-tunebtn", onClick: () => setBuildState(() => { try { localStorage.removeItem("chalkline_build"); } catch {} return DEFAULT_BUILD; }) }, "Reset")),
    caption,
    editing && h(BetaEditor, { photo, beta, onCancel: () => setEditing(false), onSave: (nb) => { setEditing(false); onSaveBeta(nb); } }),
    (videoSupported() || onShare) && h("div", { className: "cl-beta-actions2" },
      videoSupported() && !vid && h("button", { type: "button", className: "cl-beta-act", onClick: makeVideo }, h(Film, { size: 16 }), h("span", null, "Save video")),
      onShare && h("button", { type: "button", className: "cl-beta-act", onClick: onShare }, h(Share2, { size: 16 }), h("span", null, "Share card"))),
    videoSupported() && vid && h("div", { className: "cl-beta-vid" },
      vid.busy && h("div", { className: "cl-beta-vidprog" }, h("span", null, `Making video… ${Math.round(vid.p * 100)}%`), h("i", { style: { width: `${vid.p * 100}%` } })),
      vid.error && h("p", { className: "cl-hint" }, "Couldn't make the video on this device. ", h("button", { type: "button", className: "cl-beta-tunebtn", onClick: () => setVid(null) }, "Try again")),
      vid.url && h("div", { className: "cl-beta-vidout" },
        h("video", { src: vid.url, controls: true, playsInline: true, loop: true, muted: true, autoPlay: true }),
        h("div", { className: "cl-beta-vidbtns" },
          h("button", { type: "button", className: "cl-btn-primary", style: { marginTop: 0 }, onClick: shareVideo }, h(Share2, { size: 14 }), " Share"),
          h("button", { type: "button", className: "cl-btn-ghost", onClick: downloadVideo }, h(Download, { size: 14 }), " Download ." + vid.ext),
          h("button", { type: "button", className: "cl-beta-tunebtn", onClick: () => setVid(null) }, "Redo")),
        vid.ext === "webm" && h("p", { className: "cl-hint" }, "This phone saves .webm. Most apps and Android accept it; Instagram may need an .mp4."))));
}

// ---------- editor ----------
// ---------- technique suggestions (from where the limbs go) ----------
// Guesses from the geometry only: it cannot see the holds' shape, so grip types (crimp, sloper...) are not guessed, except volumes.
export function suggestTech(moves, step, asp, hipPose) {
  const groups = groupMoves(moves), g = groups[step - 1];
  if (!g || step <= 1) return null;
  const u = stickScale(moves, asp, { size: 1 });
  const d = (a, c) => Math.hypot(a.x - c.x, (a.y - c.y) * asp) / u;
  const prev = positionsAt(moves, step - 1), cur = positionsAt(moves, step);
  const real = g.filter((m) => !m.free);
  const hands = real.filter((m) => LIMBS[m.limb].kind === "hand"), feet = real.filter((m) => LIMBS[m.limb].kind === "foot");
  const travel = (m) => (prev[m.limb] ? d(prev[m.limb], m) : 0);
  const maxHand = Math.max(0, ...hands.map(travel));
  const P = hipPose || poseAt(moves, step, asp, u, { size: 1 });
  const hipY = P ? P.hip.y / asp : null; // percent of image height
  const freeFoot = g.find((m) => m.free && LIMBS[m.limb].kind === "foot" && m.dir);
  if (maxHand > 1.8 || (hands.length >= 2 && hands.every((m) => travel(m) > 1.3))) return { id: "dyno", why: "big jump for the hands" };
  if (freeFoot) return { id: "flag", why: "free foot sticking out to the side" };
  if (hipY != null && feet.some((m) => m.surf !== "wall" && m.y < hipY - (0.15 * u) / asp)) return { id: "heel-hook", why: "a foot goes above the hips" };
  if (feet.some((m) => m.surf === "wall")) return { id: "smear", why: "a foot on the plain wall" };
  if (cur.LH && cur.RH && cur.LH.surf === "volume" && cur.RH.surf === "volume") return { id: "compression", why: "both hands on volumes" };
  if (hands.some((m) => m.surf === "volume")) return { id: "sloper", why: "hand on a volume" };
  if (hipY != null && hands.some((m) => m.y > hipY + (0.2 * u) / asp)) return { id: "mantle", why: "hand pressing below the hips" };
  if (maxHand > 1.3 && feet.length === 0) return { id: "deadpoint", why: "long reach with the feet staying put" };
  if (hands.length && feet.length && cur.LF && cur.RF && !cur.LF.free && !cur.RF.free && Math.abs(cur.LF.x - cur.RF.x) / u > 1.2 && Math.abs(cur.LF.y - cur.RF.y) * asp / u < 0.6) return { id: "drop-knee", why: "feet wide apart at the same height" };
  return null;
}
// fills the steps that have no technique yet (and weren't cleared on purpose); returns the new moves and how many steps got one
export function autoFillTech(moves, asp) {
  const next = moves.map((m) => ({ ...m }));
  let n = 0;
  groupMoves(next).forEach((g, gi) => {
    if (g.some((m) => (m.tech && TECH_BY_ID[m.tech]) || m.noTech)) return;
    const s = suggestTech(next, gi + 1, asp);
    if (s) { g.forEach((m) => { next[m.idx].tech = s.id; next[m.idx].techAuto = true; }); n++; }
  });
  return { moves: next, n };
}

export function BetaEditor({ photo, beta, onSave, onCancel }) {
  const [moves, setMoves] = useState(() => ((beta && beta.moves) || []).map((m) => ({ ...m })));
  const [limb, setLimb] = useState("LH");
  const [sel, setSel] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [state, setState] = useState("loading");
  const [ping, setPing] = useState(null);
  const [tog, setTog] = useState(false);
  const [surf, setSurf] = useState("hold");
  const [techOpen, setTechOpen] = useState(false);
  const [stickOn, setStickOn] = useState(false);
  const [poses, setPoses] = useState(() => ({ ...((beta && beta.poses) || {}) }));
  const [dragKey, setDragKey] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playStep, setPlayStep] = useState(1);
  const boxRef = useRef();
  const [fitW, setFitW] = useState(0);
  const [ins, setIns] = useState(null); // when set, new moves are inserted after this index instead of at the end
  const [asp, setAsp] = useState(1.33);
  const stageRef = useRef();
  const canvasRef = useRef();
  const down = useRef(null);

  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.onload = () => setTimeout(() => {
      if (dead) return;
      try {
        const id = toImageData(img, 640);
        const res = detectHolds(id);
        setAnalysis({ ...res, img: id });
        setState("ready");
      } catch { setState("error"); }
    }, 30);
    img.onerror = () => setState("error");
    img.src = photo;
    return () => { dead = true; };
  }, [photo]);

  // hold outlines / colour spotlight
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !analysis) return;
    const { width: w, height: hgt, labels, holds } = analysis;
    c.width = w; c.height = hgt;
    const ctx = c.getContext("2d");
    const out = ctx.createImageData(w, hgt);
    const d = out.data;
    for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, l = labels[i], p = i * 4;
      const match = l && (!focus || holds[l - 1].color === focus);
      if (focus && !match) { d[p + 3] = 120; continue; }
      if (!l) continue;
      const edge = x === 0 || labels[i - 1] !== l || x === w - 1 || labels[i + 1] !== l || y === 0 || labels[i - w] !== l || y === hgt - 1 || labels[i + w] !== l;
      if (edge) { d[p] = d[p + 1] = d[p + 2] = 255; d[p + 3] = focus ? 255 : 170; }
    }
    ctx.putImageData(out, 0, 0);
  }, [analysis, focus]);

  const colorCounts = useMemo(() => {
    const c = {};
    if (analysis) analysis.holds.forEach((hd) => { c[hd.color] = (c[hd.color] || 0) + 1; });
    return Object.keys(c).sort((a, b) => c[b] - c[a]).map((k) => [k, c[k]]);
  }, [analysis]);

  const place = (x, y, color) => {
    if (sel != null) {
      setMoves((ms) => ms.map((m, i) => (i === sel ? { ...m, x, y, free: false, dir: 0, color: m.surf === "wall" ? null : color } : m)));
      setSel(null);
      return;
    }
    addMove({ id: rid(), limb, surf, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, color: surf === "wall" ? null : color, note: "", tech: null, together: tog && moves.length > 0 });
    setTog(false);
    setLimb(NEXT_LIMB[limb]);
  };
  const addMove = (m) => {
    if (ins == null) { setMoves((ms) => [...ms, m]); setLastView("last"); return; }
    setMoves((ms) => { const a = ms.slice(); a.splice(ins + 1, 0, m); return a; });
    setIns(ins + 1);
  };
  // move a whole step (all its moves) one place earlier / later
  const shiftStep = (dir) => {
    const groups = groupMoves(moves);
    const gi = groups.findIndex((g) => g.some((m) => m.idx === sel)), to = gi + dir;
    if (gi < 0 || to < 0 || to >= groups.length) return;
    const id = moves[sel].id;
    const order = groups.slice();
    [order[gi], order[to]] = [order[to], order[gi]];
    const next = [];
    order.forEach((g) => g.forEach((m, k) => { const { idx, ...rest } = m; next.push({ ...rest, together: k > 0 }); }));
    setMoves(next);
    setSel(next.findIndex((m) => m.id === id));
  };

  const handleTap = (cx, cy) => {
    const r = stageRef.current.getBoundingClientRect();
    const fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
    let color = "grey";
    if (analysis) {
      const { width: w, height: hgt, labels, holds } = analysis;
      const px = Math.min(w - 1, Math.max(0, Math.floor(fx * w))), py = Math.min(hgt - 1, Math.max(0, Math.floor(fy * hgt)));
      let l = labels[py * w + px];
      if (!l) {
        let best = 1e9;
        for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
          const x = px + dx, y = py + dy;
          if (x < 0 || y < 0 || x >= w || y >= hgt) continue;
          const ll = labels[y * w + x];
          if (ll && dx * dx + dy * dy < best) { best = dx * dx + dy * dy; l = ll; }
        }
      }
      if (l) color = holds[l - 1].color;
      else {
        const g = growHoldAt(analysis.img, px, py);
        if (g) color = g.color;
        else {
          const q = (py * w + px) * 4, dd = analysis.img.data;
          const [hh, ss, vv] = rgb2hsv(dd[q], dd[q + 1], dd[q + 2]);
          color = nameColor(hh, ss, vv);
        }
      }
    }
    setPing({ x: fx * 100, y: fy * 100, k: Date.now() });
    place(fx * 100, fy * 100, color);
  };

  const done = () => onSave(moves.length ? { v: 1, color: focus || null, moves: autoFillTech(moves, asp).moves.map(({ id, limb: l, surf: sf, free: fr, dir, x, y, color, note, tech, together, techAuto, noTech }, i) => ({ id, limb: l, surf: sf || "hold", x, y, color, note: note || "", tech: tech || null, together: !!(together && i > 0), ...(techAuto ? { techAuto: true } : {}), ...(noTech ? { noTech: true } : {}), ...(fr ? { free: true, dir: dir || 0 } : {}) })), ...savedPoses() } : null);
  const updateSel = (patch) => setMoves((ms) => ms.map((m, i) => (i === sel ? { ...m, ...patch } : m)));
  // the technique applies to every move of the step (grouping is always the user's choice, also for a dyno)
  const setTech = (t) => setMoves((ms) => {
    const next = ms.map((x) => ({ ...x }));
    const grp = groupMoves(next).find((g) => g.some((x) => x.idx === sel));
    grp.forEach((x) => { next[x.idx].tech = t; next[x.idx].techAuto = false; next[x.idx].noTech = !t; });
    return next;
  });
  const removeSel = () => { setMoves((ms) => ms.filter((_, i) => i !== sel)); setSel(null); };
  const steps = useMemo(() => stepOfMove(moves), [moves]);
  const [suggestMsg, setSuggestMsg] = useState("");
  const sugg = useMemo(() => (sel != null ? suggestTech(moves, steps[sel], asp) : null), [moves, sel, asp]);
  // stickman preview: shows the pose at the selected step (or the last one) and lets you drag its joints
  const groupsAll = useMemo(() => groupMoves(moves), [moves]);
  const nSteps = groupsAll.length;
  // which step the stickman shows: the selected one, the one being added after, else where you last were
  // (an existing beta opens on its first step; new moves follow the latest step)
  const [lastView, setLastView] = useState(() => (beta && beta.moves && beta.moves.length ? 1 : "last"));
  useEffect(() => { if (sel != null && steps[sel]) setLastView(steps[sel]); }, [sel, steps]);
  useEffect(() => { if (ins != null && steps[ins]) setLastView(steps[ins]); }, [ins, steps]);
  const viewStep = Math.max(1, Math.min(nSteps || 1, playing ? playStep : sel != null ? steps[sel] : ins != null && steps[ins] ? steps[ins] : lastView === "last" ? nSteps : lastView));
  const uBody = useMemo(() => (moves.length ? stickScale(moves, asp, loadBuild()) : 0), [moves, asp]);
  const target = useMemo(() => (stickOn && moves.length ? poseAt(moves, viewStep, asp, uBody, loadBuild(), poses) : null), [stickOn, moves, viewStep, asp, uBody, poses]);
  const [pose] = usePoseTween(target, stickOn, 1, dragKey != null);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setPlayStep((s) => { if (s >= nSteps) { setPlaying(false); return nSteps; } return s + 1; }), 1300);
    return () => clearInterval(t);
  }, [playing, nSteps]);
  const gid = groupsAll[viewStep - 1] ? groupsAll[viewStep - 1][0].id : null;
  const clampPct = (v) => Math.max(0, Math.min(100, v));
  const stageXY = (e) => { const r = stageRef.current.getBoundingClientRect(); return { x: clampPct(((e.clientX - r.left) / r.width) * 100), y: clampPct(((e.clientY - r.top) / r.height) * 100) }; };
  const startDrag = (key) => (e) => { e.stopPropagation(); e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDragKey(key); };
  const onDragMove = (key) => (e) => {
    if (dragKey !== key || !gid) return;
    const p = stageXY(e);
    if (key === "hip") setPoses((ps) => ({ ...ps, [gid]: { ...ps[gid], hip: p } }));
    else if (key === "LE" || key === "RE") setPoses((ps) => ({ ...ps, [gid]: { ...ps[gid], elbows: { ...((ps[gid] || {}).elbows || {}), [key[0]]: p } } }));
    else if (key === "LK" || key === "RK") setPoses((ps) => ({ ...ps, [gid]: { ...ps[gid], knees: { ...((ps[gid] || {}).knees || {}), [key[0]]: p } } }));
    else { const at = positionsAt(moves, viewStep)[key]; if (at) setMoves((ms) => ms.map((m, i) => (i === at.idx ? { ...m, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 } : m))); }
  };
  const endDrag = () => setDragKey(null);
  const savedPoses = () => {
    const ids = new Set(groupsAll.map((g) => g[0].id)), o = {};
    Object.keys(poses).forEach((k) => { if (ids.has(k) && poses[k] && Object.keys(poses[k]).length) o[k] = poses[k]; });
    return Object.keys(o).length ? { poses: o } : {};
  };
  // at 1x the whole photo fits in the visible area; 2x / 3x zoom in from there
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const fit = () => { const w = el.clientWidth, hh = el.clientHeight; if (w && hh) setFitW(Math.max(120, Math.min(w, hh / asp))); };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [asp]);
  const offs = useMemo(() => spreadOffsets(moves.filter((m) => !m.free).map((m) => ({ key: m.id, x: m.x, y: m.y })), asp), [moves, asp]);

  const curLimb = sel != null ? moves[sel].limb : limb;
  const groups = groupMoves(moves);
  const selFree = sel != null && moves[sel].free;
  const pickLimb = (k) => { if (sel != null) updateSel({ limb: k }); else setLimb(k); };
  const addFree = (dir) => { addMove({ id: rid(), limb, free: true, dir, x: 50, y: 50, surf: "hold", color: null, note: "", tech: null, together: tog && moves.length > 0 }); setTog(false); setLimb(NEXT_LIMB[limb]); };
  const insertAfterStep = (g) => { setIns(Math.max(...g.map((m) => m.idx))); setSel(null); };
  const limbButtons = h("div", { className: "cl-beta-limbs" },
    Object.keys(LIMBS).map((k) => h("button", { key: k, type: "button", className: curLimb === k ? "cl-beta-limb active" : "cl-beta-limb", style: curLimb === k ? { borderColor: LIMBS[k].color, color: LIMBS[k].color } : void 0, onClick: () => pickLimb(k) },
      h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label)));
  const dirChips = (value, onPick) => [["Hang", 0], ["Out ←", -1], ["Out →", 1]].map(([label, dir]) => h("button", { key: label, type: "button", className: value === dir ? "active" : "", onClick: () => onPick(dir) }, label));
  const stepStrip = h("div", { className: "cl-beta-strip" },
    moves.length === 0 && h("span", { className: "cl-hint" }, "Your steps will appear here"),
    groups.map((g, gi) => h(React.Fragment, { key: gi },
      h("div", { className: g.some((m) => m.idx === sel) ? "cl-beta-stepc active" : "cl-beta-stepc" },
        h("span", { className: "cl-beta-stepn" }, gi + 1),
        g.map((m) => h("button", { key: m.id, type: "button", className: sel === m.idx ? "cl-beta-pill active" : "cl-beta-pill", style: { background: LIMBS[m.limb].color, color: LIMBS[m.limb].ink, opacity: m.free ? 0.6 : 1 }, onClick: () => setSel(sel === m.idx ? null : m.idx) }, m.limb, m.free ? "~" : "", m.tech ? "•" : ""))),
      h("button", { type: "button", className: ins != null && g.some((m) => m.idx === ins) ? "cl-beta-plus active" : "cl-beta-plus", onClick: () => (ins != null && g.some((m) => m.idx === ins) ? setIns(null) : insertAfterStep(g)), "aria-label": `Add a step after step ${gi + 1}` }, "+"))));
  const addPanel = h("div", { className: "cl-beta-panel" },
    ins != null && h("div", { className: "cl-beta-ins" }, h("span", null, `Adding after step ${steps[ins]} — pick a limb, tap the hold`), h("button", { type: "button", onClick: () => setIns(null) }, "Stop")),
    moves.length === 0 && ins == null && h("p", { className: "cl-beta-tip" }, "Pick a limb, then tap the hold it uses. Do the moves in order."),
    limbButtons,
    h("div", { className: "cl-beta-row" },
      h("span", { className: "cl-beta-lab" }, "On a"),
      SURFS.map(([k, label]) => h("button", { key: k, type: "button", className: surf === k ? "cl-beta-chip active" : "cl-beta-chip", onClick: () => setSurf(k) }, label)),
      moves.length > 0 && h("button", { type: "button", className: tog ? "cl-beta-chip active wide" : "cl-beta-chip wide", onClick: () => setTog(!tog) }, h(Link2, { size: 13 }), tog ? " Same step: ON" : " Same step")),
    h("div", { className: "cl-beta-row free" }, h("span", { className: "cl-beta-lab" }, `${LIMBS[limb].label} off the wall`), dirChips(null, addFree)),
    moves.length > 2 && h("div", { className: "cl-beta-row" }, h("button", { type: "button", className: "cl-beta-chip", onClick: () => { const r = autoFillTech(moves, asp); setMoves(r.moves); setSuggestMsg(r.n ? `Added a technique to ${r.n} step${r.n === 1 ? "" : "s"} \u2014 tap a step to change it` : "No clear technique found for the steps without one"); } }, h(Sparkles, { size: 13 }), " Suggest techniques"), suggestMsg && h("span", { className: "cl-beta-lab" }, suggestMsg)));
  const m0 = sel != null ? moves[sel] : null;
  const curStepTech = sel != null ? stepTech(groups.find((g) => g.some((x) => x.idx === sel))) : null;
  const editPanel = m0 && h("div", { className: "cl-beta-panel" },
    h("div", { className: "cl-beta-edhead" }, h("b", null, `Step ${steps[sel]} · ${LIMBS[m0.limb].label}${m0.free ? " (free)" : ""}`), h("button", { type: "button", className: "cl-icon-btn", onClick: () => { setSel(null); setTechOpen(false); }, "aria-label": "Close editor" }, h(X, { size: 16 }))),
    h("div", { className: "compact" }, limbButtons),
    h("div", { className: "cl-beta-row" },
      h("span", { className: "cl-beta-lab" }, m0.free ? "Free limb" : "On a"),
      m0.free ? [dirChips(m0.dir || 0, (dir) => updateSel({ dir })), h("button", { key: "back", type: "button", className: "cl-beta-chip wide", onClick: () => updateSel({ free: false, dir: 0 }) }, "Put on a hold")] : SURFS.map(([k, label]) => h("button", { key: k, type: "button", className: (m0.surf || "hold") === k ? "cl-beta-chip active" : "cl-beta-chip", onClick: () => updateSel({ surf: k, color: k === "wall" ? null : m0.color }) }, label)),
      sel > 0 && h("button", { type: "button", className: m0.together ? "cl-beta-chip active wide" : "cl-beta-chip wide", onClick: () => updateSel({ together: !m0.together }) }, h(Link2, { size: 13 }), " Same step as previous")),
    !m0.free && h("div", { className: "cl-beta-row free" }, h("span", { className: "cl-beta-lab" }, "Or let it go"), dirChips(null, (dir) => updateSel({ free: true, dir }))),
    sugg && sugg.id !== curStepTech && h("button", { type: "button", className: "cl-beta-suggest", onClick: () => setTech(sugg.id) }, h(Sparkles, { size: 14 }), h("span", null, "Suggested: ", h("b", null, TECH_BY_ID[sugg.id].name), h("small", null, " \u2014 ", sugg.why)), h("em", null, "Use")),
    h("button", { type: "button", className: "cl-beta-techbtn", onClick: () => setTechOpen(!techOpen) }, h("span", null, "Technique"), h("b", null, curStepTech ? TECH_BY_ID[curStepTech].name : "None — tap to choose"), h(ChevronRight, { size: 16, style: { transform: techOpen ? "rotate(90deg)" : "none" } })),
    techOpen && h(TechniquePicker, { value: curStepTech, onChange: (t) => { setTech(t); setTechOpen(false); } }),
    h("input", { className: "cl-input", value: m0.note || "", onChange: (e) => updateSel({ note: e.target.value }), placeholder: "Note (e.g. big reach, keep hips in)" }),
    h("div", { className: "cl-beta-order" },
      h("button", { type: "button", onClick: () => shiftStep(-1), disabled: steps[sel] <= 1 }, "↑ Step earlier"),
      h("button", { type: "button", onClick: () => shiftStep(1), disabled: steps[sel] >= groups.length }, "↓ Step later")));
  return h("div", { className: "cl-overlay cl-layer-top cl-beta-editor" },
    h("div", { className: "cl-overlay-header" },
      h("button", { className: "cl-icon-btn", onClick: onCancel, "aria-label": "Cancel" }, h(ArrowLeft, { size: 20 })),
      h("span", { className: "cl-overlay-title" }, "Build beta"),
      h("button", { className: "cl-icon-btn cl-beta-done", onClick: done, "aria-label": "Done" }, h(Check, { size: 20 }))),
    h("div", { className: "cl-beta-body ed" },
      h("div", { className: "cl-beta-stagebox" },
        h("div", { className: "cl-beta-tools" },
          h("div", { className: "cl-beta-zoom" }, [1, 2, 3].map((z) => h("button", { key: z, type: "button", className: zoom === z ? "active" : "", onClick: () => setZoom(z) }, z === 1 ? h(ZoomIn, { size: 14 }) : null, `${z}×`))),
          moves.length > 0 && h("button", { type: "button", className: stickOn ? "cl-beta-stog active" : "cl-beta-stog", onClick: () => { setStickOn((v) => !v); setPlaying(false); } }, h(PersonStanding, { size: 14 }), " Stickman"),
          state === "loading" && h("span", { className: "cl-hint" }, "Finding holds…"),
          state === "ready" && h("span", { className: "cl-hint" }, h(Sparkles, { size: 12 }), ` ${analysis.holds.length} holds found`)),
        colorCounts.length > 0 && h("div", { className: "cl-beta-colors" },
          h("button", { type: "button", className: !focus ? "cl-beta-color active" : "cl-beta-color", onClick: () => setFocus(null) }, "All"),
          colorCounts.map(([k, c]) => h("button", { key: k, type: "button", className: focus === k ? "cl-beta-color active" : "cl-beta-color", onClick: () => setFocus(focus === k ? null : k) }, h("i", { style: { background: COLOR_HEX[k] } }), k, h("small", null, c)))),
        h("div", { className: "cl-beta-scroll fit", ref: boxRef },
          h("div", {
            className: "cl-beta-stage editing", ref: stageRef, style: { width: fitW ? `${fitW * zoom}px` : `${zoom * 100}%` },
            onPointerDown: (e) => { down.current = { x: e.clientX, y: e.clientY }; },
            onPointerUp: (e) => { const d0 = down.current; down.current = null; if (d0 && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 8) handleTap(e.clientX, e.clientY); },
          },
            h("img", { src: photo, alt: "", draggable: false, onLoad: (e) => { if (e.target.naturalWidth) setAsp(e.target.naturalHeight / e.target.naturalWidth); } }),
            h("canvas", { ref: canvasRef, className: "cl-beta-canvas" }),
            h(Trails, { moves, step: 9999, activeGroup: -1 }),
            stickOn && pose && h(Stickman, { pose, asp }),
            stickOn && pose && !playing && [["hip", pose.hip, "core"], ["LE", pose.LE, "joint"], ["RE", pose.RE, "joint"], ["LK", pose.LK, "joint"], ["RK", pose.RK, "joint"]]
              .concat(Object.keys(positionsAt(moves, viewStep)).map((k) => [k, pose[k], "end"]))
              .map(([key, p, kind]) => h("div", { key, className: `cl-beta-handle ${kind}${dragKey === key ? " drag" : ""}`, style: { left: `${p.x}%`, top: `${p.y / asp}%` }, onPointerDown: startDrag(key), onPointerMove: onDragMove(key), onPointerUp: endDrag, onPointerCancel: endDrag })),
            moves.map((m, i) => (m.free ? null : h(Marker, { key: m.id, m, off: offs[m.id], number: steps[i], selected: sel === i, small: zoom === 1 }))),
            ping && h("span", { key: ping.k, className: "cl-beta-ping", style: { left: `${ping.x}%`, top: `${ping.y}%` } })))),
        stickOn && h("div", { className: "cl-beta-sstrip" },
          h("button", { type: "button", className: "cl-beta-btn", disabled: viewStep <= 1, onClick: () => { setPlaying(false); setSel(groupsAll[viewStep - 2][0].idx); }, "aria-label": "Previous step" }, h(ChevronLeft, { size: 18 })),
          h("button", { type: "button", className: "cl-beta-btn primary", onClick: () => { if (playing) setPlaying(false); else { setSel(null); setPlayStep(1); setPlaying(true); } }, "aria-label": playing ? "Pause" : "Play motion" }, playing ? h(Pause, { size: 18 }) : h(Play, { size: 18 })),
          h("button", { type: "button", className: "cl-beta-btn", disabled: viewStep >= nSteps, onClick: () => { setPlaying(false); setSel(groupsAll[viewStep][0].idx); }, "aria-label": "Next step" }, h(ChevronRight, { size: 18 })),
          h("span", { className: "cl-beta-slab" }, `Step ${viewStep}/${nSteps}`, h("small", null, "Drag \u25CF core, \u25C6 elbows & knees, \u25CB hands & feet")),
          gid && poses[gid] && h("button", { type: "button", className: "cl-beta-tunebtn", onClick: () => setPoses((ps) => { const n2 = { ...ps }; delete n2[gid]; return n2; }) }, "Reset pose")),
      h("div", { className: "cl-beta-dock" },
        stepStrip,
        h("div", { className: "cl-beta-dockbody" }, sel != null ? editPanel : addPanel),
        h("div", { className: "cl-beta-dockbar" },
          sel != null
            ? [h("button", { key: "d", type: "button", className: "cl-btn-ghost danger", onClick: () => { removeSel(); setTechOpen(false); } }, h(Trash2, { size: 14 }), " Delete"), h("button", { key: "k", type: "button", className: "cl-btn-primary", onClick: () => { setSel(null); setTechOpen(false); } }, "OK")]
            : [h("button", { key: "u", type: "button", className: "cl-btn-ghost", disabled: moves.length === 0, onClick: () => setMoves((ms) => ms.slice(0, -1)) }, h(Undo2, { size: 14 }), " Undo"), h("button", { key: "n", type: "button", className: "cl-btn-primary", onClick: done }, "Save beta")]))));
}

// ---------- form field ----------
export function BetaField({ photo, beta, onChange }) {
  const [open, setOpen] = useState(false);
  if (!photo) return null;
  return h("div", { className: "cl-beta-field" },
    hasBeta(beta) ? h("div", { className: "cl-beta-field-row" },
      h("div", null, h("b", null, "Beta"), h("small", null, `${beta.moves.length} moves — friends can replay it step by step`)),
      h("button", { type: "button", className: "cl-btn-ghost", onClick: () => setOpen(true) }, "Edit"),
      h("button", { type: "button", className: "cl-icon-btn", onClick: () => onChange(null), "aria-label": "Remove beta" }, h(X, { size: 16 })))
      : h("button", { type: "button", className: "cl-photo-btn cl-beta-build", onClick: () => setOpen(true) }, h(Sparkles, { size: 16 }), " Build beta — mark the holds and moves"),
    open && h(BetaEditor, { photo, beta, onCancel: () => setOpen(false), onSave: (b) => { onChange(b); setOpen(false); } }));
}

// ---------- share-card drawing ----------
export function drawBeta(ctx, imgRect, view, beta, k = 1) {
  const allMoves = (beta && beta.moves) || [];
  if (!allMoves.length) return;
  const stepsAll = stepOfMove(allMoves);
  const keep = allMoves.map((m, i) => i).filter((i) => !allMoves[i].free);
  const moves = keep.map((i) => allMoves[i]), steps = keep.map((i) => stepsAll[i]);
  if (!moves.length) return;
  const P = (m) => ({
    x: Math.min(view.x + view.w - 14 * k, Math.max(view.x + 14 * k, imgRect.x + (m.x / 100) * imgRect.w)),
    y: Math.min(view.y + view.h - 14 * k, Math.max(view.y + 14 * k, imgRect.y + (m.y / 100) * imgRect.h)),
  });
  const pts = moves.map(P);
  const done = new Set();
  pts.forEach((a, i) => {
    if (done.has(i)) return;
    const cl = [i];
    pts.forEach((b, j) => { if (j !== i && !done.has(j) && Math.hypot(a.x - b.x, a.y - b.y) < 22 * k) cl.push(j); });
    cl.forEach((j) => done.add(j));
    if (cl.length > 1) cl.forEach((j, q) => { pts[j] = { x: pts[j].x + (q % 2 ? 1 : -1) * 11 * k, y: pts[j].y + (q > 1 ? 11 * k : 0) }; });
  });
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const hands = moves.map((m, i) => ({ m, p: pts[i] })).filter((o) => LIMBS[o.m.limb].kind === "hand").map((o) => o.p);
  if (hands.length > 1) {
    ctx.beginPath();
    ctx.moveTo(hands[0].x, hands[0].y);
    for (let i = 1; i < hands.length - 1; i++) {
      const mx = (hands[i].x + hands[i + 1].x) / 2, my = (hands[i].y + hands[i + 1].y) / 2;
      ctx.quadraticCurveTo(hands[i].x, hands[i].y, mx, my);
    }
    ctx.lineTo(hands[hands.length - 1].x, hands[hands.length - 1].y);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3 * k;
    ctx.setLineDash([8 * k, 6 * k]);
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6 * k;
    ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur = 0;
  }
  moves.forEach((m, i) => {
    const p = pts[i], L = LIMBS[m.limb], r = (L.kind === "hand" ? 13 : 11) * k;
    ctx.fillStyle = L.color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5 * k;
    ctx.beginPath();
    if (L.kind === "hand") ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    else { const q = r * 0.95; ctx.roundRect ? ctx.roundRect(p.x - q, p.y - q, q * 2, q * 2, 5 * k) : ctx.rect(p.x - q, p.y - q, q * 2, q * 2); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = L.ink; ctx.font = `800 ${12 * k}px sans-serif`; ctx.textAlign = "center";
    ctx.fillText(String(steps[i]), p.x, p.y + 4.2 * k);
  });
  ctx.restore();
}


// draws the stick figure; F maps a pose point to canvas pixels, unit = pixels per pose unit
function paintPose(ctx, P, F, unit) {
  const line = (pts, col, lw) => { ctx.beginPath(); pts.forEach((p, i) => { const q = F(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.strokeStyle = col; ctx.lineWidth = lw * unit; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };
  const segs = [[[P.neck, P.hip], "#F2F0E9", 2.4], [[P.LS, P.RS], "#F2F0E9", 2], [[P.LP, P.RP], "#F2F0E9", 2], [[P.LS, P.LE, P.LH], LIMBS.LH.color, 2], [[P.RS, P.RE, P.RH], LIMBS.RH.color, 2], [[P.LP, P.LK, P.LF], LIMBS.LF.color, 2.1], [[P.RP, P.RK, P.RF], LIMBS.RF.color, 2.1]];
  segs.forEach(([pts, , lw]) => line(pts, "rgba(0,0,0,0.65)", lw + 1.6));
  segs.forEach(([pts, col, lw]) => line(pts, col, lw));
  const hp = F(P.head);
  ctx.beginPath(); ctx.arc(hp.x, hp.y, P.headR * unit, 0, Math.PI * 2); ctx.fillStyle = "#2A2D27"; ctx.fill(); ctx.lineWidth = 1.5 * unit; ctx.strokeStyle = "#F2F0E9"; ctx.stroke();
}

// draws the figure as one translucent layer (so overlapping limbs don't get darker)
let softLayer = null;
function paintPoseSoft(ctx, P, F, unit, alpha) {
  if (alpha == null || alpha >= 0.99) { paintPose(ctx, P, F, unit); return; }
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if (!softLayer) softLayer = document.createElement("canvas");
  if (softLayer.width !== W || softLayer.height !== H) { softLayer.width = W; softLayer.height = H; }
  const lc = softLayer.getContext("2d");
  lc.clearRect(0, 0, W, H);
  paintPose(lc, P, F, unit);
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(softLayer, 0, 0); ctx.restore();
}

// ---------- animation -> video ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export function videoSupported() {
  return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined" && !!HTMLCanvasElement.prototype.captureStream;
}
// records the stickman beta as a vertical video (720x1280). Resolves { blob, ext }.
// Frame-by-frame encoding (WebCodecs + mp4 muxer): exact length, real .mp4, and it doesn't depend on the screen staying awake.
async function encodeWithWebCodecs(canvas, frame, total, W, H, onProgress) {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  const { Muxer, ArrayBufferTarget } = await import("./mp4-muxer.js");
  const tries = [["avc", "avc1.640028"], ["avc", "avc1.4d0028"], ["avc", "avc1.42002a"], ["avc", "avc1.42001f"], ["vp9", "vp09.00.10.08"]];
  let pick = null;
  for (const [codec, str] of tries) {
    try { const s = await VideoEncoder.isConfigSupported({ codec: str, width: W, height: H, bitrate: 4e6, framerate: 30 }); if (s && s.supported) { pick = { codec, str }; break; } } catch {}
  }
  if (!pick) return null;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: pick.codec, width: W, height: H }, fastStart: "in-memory" });
  let err = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { err = e; } });
  enc.configure({ codec: pick.str, width: W, height: H, bitrate: 4e6, framerate: 30 });
  const fps = 30, frames = Math.ceil((total / 1000) * fps);
  for (let i = 0; i <= frames; i++) {
    if (err) throw err;
    frame(Math.min(total, (i * 1000) / fps));
    const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    enc.encode(vf, { keyFrame: i % 30 === 0 });
    vf.close();
    if (enc.encodeQueueSize > 6 || i % 8 === 0) { if (onProgress) onProgress(Math.min(1, i / frames)); await new Promise((r) => setTimeout(r, 0)); }
  }
  await enc.flush();
  if (err) throw err;
  muxer.finalize();
  return { blob: new Blob([target.buffer], { type: "video/mp4" }), ext: "mp4", type: "video/mp4" };
}

export async function recordBetaVideo({ photo, beta, title, subtitle, build, onProgress }) {
  const moves = (beta && beta.moves) || [];
  const groups = groupMoves(moves), n = groups.length;
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = photo; });
  const W = 720, H = 1280, canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const iw = img.width, ih = img.height, asp = ih / iw;
  const ax = 24, ay = 150, aw = W - 48, ah = 900;
  const sc = Math.min(aw / iw, ah / ih), dw = iw * sc, dh = ih * sc, dx = ax + (aw - dw) / 2, dy = ay + (ah - dh) / 2;
  const bd = { size: 0.75, arm: 1, leg: 1, torso: 1, opacity: 0.7, ...(build || loadBuild()) };
  const u = stickScale(moves, asp, bd);
  const poses = [null];
  for (let s = 1; s <= n; s++) poses.push(poseAt(moves, s, asp, u, bd, beta.poses));
  const F = (p) => ({ x: dx + (p.x / 100) * dw, y: dy + (p.y / 100) * dw });
  const unit = dw / 100;
  const TWEEN = 800, HOLD = 900, LEAD = 900, TAIL = 1500;
  const total = LEAD + n * (TWEEN + HOLD) + TAIL;
  const frame = (t) => {
    ctx.fillStyle = "#14150F"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "left"; ctx.fillStyle = "#F2F0E9"; ctx.font = "800 44px sans-serif";
    ctx.fillText((title || "Beta").slice(0, 26), ax, 80);
    ctx.fillStyle = "#A9A596"; ctx.font = "600 26px sans-serif"; ctx.fillText(subtitle || "", ax, 120);
    ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip(); ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
    let step = 0, e = 1;
    if (t >= LEAD) { const k = Math.min(n, Math.floor((t - LEAD) / (TWEEN + HOLD))) + 1; step = Math.min(n, k); const local = t - LEAD - (step - 1) * (TWEEN + HOLD); const tt = Math.min(1, Math.max(0, local / TWEEN)); e = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2; }
    const prev = step > 1 ? poses[step - 1] : null;
    const P = step ? lerpPose(prev, poses[step], e) : null;
    if (P) paintPoseSoft(ctx, P, F, unit, bd.opacity * (step === 1 ? e : 1));
    if (step) {
      const pos = positionsAt(moves, step);
      const g = groups[step - 1];
      ctx.fillStyle = "#F2F0E9"; ctx.font = "800 36px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Step ${step}/${n}`, ax, 1112);
      ctx.font = "600 28px sans-serif"; ctx.fillStyle = "#D9D4C4";
      ctx.fillText(g.map((m) => m.limb + (m.free ? " free" : "")).join(" + "), ax, 1156);
      const tech = stepTech(g) ? TECH_BY_ID[stepTech(g)].name : "";
      if (tech) { ctx.fillStyle = "#FF8A4C"; ctx.fillText(tech, ax, 1198); }
    }
    ctx.fillStyle = "#6F6C60"; ctx.font = "700 22px sans-serif"; ctx.textAlign = "right"; ctx.fillText("CHALKLINE", W - ax, 1240);
    for (let i = 0; i < n; i++) { ctx.fillStyle = i < step ? "#FF6B35" : "#3A3B33"; ctx.fillRect(ax + i * (aw / n), 1250, aw / n - 4, 6); }
  };
  try { const r = await encodeWithWebCodecs(canvas, frame, total, W, H, onProgress); if (r) return r; } catch (e) { console.warn("WebCodecs video failed, using the recorder", e); }
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
  const chunks = [];
  rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });
  frame(0);
  rec.start(200);
  const t0 = performance.now();
  await new Promise((res) => {
    const tick = () => {
      const t = performance.now() - t0;
      frame(Math.min(t, total));
      if (onProgress) onProgress(Math.min(1, t / total));
      if (t < total) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  await wait(150);
  rec.stop();
  await stopped;
  const type = (rec.mimeType || mime || "video/webm").split(";")[0];
  return { blob: new Blob(chunks, { type }), ext: type.includes("mp4") ? "mp4" : "webm", type };
}

// ---------- share-card: stickman frame (a crop of the wall with the climber at one step) ----------
export function drawStickFrame(ctx, x, y, w, h, img, beta, step, label, build) {
  const moves = (beta && beta.moves) || [];
  if (!moves.length || !img) return;
  const bd = { size: 0.75, arm: 1, leg: 1, torso: 1, opacity: 0.7, ...(build || loadBuild()) };
  const iw = img.width, ih = img.height, asp = ih / iw;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  moves.forEach((m) => { if (m.free) return; const px = (m.x / 100) * iw, py = (m.y / 100) * ih; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); });
  const bw = x1 - x0, bh = y1 - y0;
  let ch = Math.max(bh * 1.7, (bw * 1.7 * h) / w, ih * 0.4);
  let cw = (ch * w) / h;
  if (cw > iw) { cw = iw; ch = (cw * h) / w; }
  if (ch > ih) { ch = ih; cw = (ch * w) / h; }
  const sx = Math.min(iw - cw, Math.max(0, (x0 + x1) / 2 - cw / 2)), sy = Math.min(ih - ch, Math.max(0, (y0 + y1) / 2 - ch / 2));
  const k = w / cw, unit = (iw / 100) * k; // px per percent-x unit in the frame
  const F = (p) => ({ x: x + (p.x * (iw / 100) - sx) * k, y: y + (p.y * (iw / 100) - sy) * k });
  ctx.save();
  const r = 14;
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.clip();
  ctx.drawImage(img, sx, sy, cw, ch, x, y, w, h);
  const pos = positionsAt(moves, step);
  const P0 = poseAt(moves, step, asp, stickScale(moves, asp, bd), bd, beta.poses);
  if (P0) {
    const P = P0;
    paintPoseSoft(ctx, P, F, unit, bd.opacity);
  }
  if (label) {
    ctx.font = "800 18px sans-serif"; ctx.textAlign = "left";
    const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x + 10, y + h - 36, tw, 26);
    ctx.fillStyle = "#fff"; ctx.fillText(label, x + 20, y + h - 17);
  }
  ctx.restore();
}
