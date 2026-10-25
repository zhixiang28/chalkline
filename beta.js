// Beta builder + player: mark which hold each hand/foot uses, in order, and replay it step by step.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Play, Pause, Undo2, Trash2, Check, ChevronLeft, ChevronRight, ZoomIn, Sparkles, X, PersonStanding, Link2 } from "lucide-react";
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
export function groupMoves(moves) {
  const groups = [];
  (moves || []).forEach((m, i) => {
    if (i === 0 || !m.together) groups.push([]);
    groups[groups.length - 1].push({ ...m, idx: i });
  });
  return groups;
}
export const stepOfMove = (moves) => { const map = []; groupMoves(moves).forEach((g, gi) => g.forEach((m) => { map[m.idx] = gi + 1; })); return map; };

// where every limb is after `step` steps
export function positionsAt(moves, step) {
  const pos = {};
  groupMoves(moves).slice(0, step).forEach((g, gi) => g.forEach((m) => { pos[m.limb] = { ...m, gi }; }));
  return pos;
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

function Marker({ m, number, selected, active, small, off }) {
  const L = LIMBS[m.limb];
  return h("div", {
    className: `cl-beta-mk ${L.kind}${selected ? " selected" : ""}${active ? " active" : ""}${small ? " small" : ""}`,
    style: { left: `${m.x + (off ? off.dx : 0)}%`, top: `${m.y + (off ? off.dy : 0)}%`, background: L.color, color: L.ink },
  }, h("span", null, L.short), number != null && h("i", null, number));
}

function Trails({ moves, step, activeGroup }) {
  const groups = groupMoves(moves).slice(0, step);
  const hands = [];
  groups.forEach((g) => g.forEach((m) => { if (LIMBS[m.limb].kind === "hand") hands.push(m); }));
  const prev = {};
  const segs = [];
  groups.forEach((g, gi) => g.forEach((m) => { if (gi === activeGroup && prev[m.limb]) segs.push({ a: prev[m.limb], b: m, color: LIMBS[m.limb].color }); prev[m.limb] = m; }));
  groups.forEach((g, gi) => { if (gi !== activeGroup) g.forEach((m) => { prev[m.limb] = m; }); });
  return h("svg", { className: "cl-beta-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none" },
    hands.length > 1 && h("polyline", { points: hands.map((m) => `${m.x},${m.y}`).join(" "), fill: "none", stroke: "rgba(255,255,255,0.55)", strokeWidth: 2, strokeDasharray: "4 3", vectorEffect: "non-scaling-stroke", strokeLinecap: "round", strokeLinejoin: "round" }),
    segs.map((sg, i) => h("line", { key: i, x1: sg.a.x, y1: sg.a.y, x2: sg.b.x, y2: sg.b.y, stroke: sg.color, strokeWidth: 3.5, vectorEffect: "non-scaling-stroke", strokeLinecap: "round" })));
}

export function BetaLegend() {
  return h("div", { className: "cl-beta-legend" }, Object.keys(LIMBS).map((k) => h("span", { key: k }, h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label)));
}

// ---------- stickman overlay ----------
function Stickman({ disp, asp, u }) {
  const t = {};
  Object.keys(disp).forEach((k) => { t[k] = { x: disp[k].x, y: disp[k].y * asp }; });
  if (!Object.keys(t).length) return null;
  const P = solvePose(t, u, {});
  const L = poseLines(P);
  const col = (k) => LIMBS[k].color;
  const body = (key, d, w, c) => h("path", { key, d, fill: "none", stroke: c, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" });
  return h("svg", { className: "cl-beta-svg stick", viewBox: `0 0 100 ${100 * asp}`, preserveAspectRatio: "none" },
    [["torso", L.torso, 2.4], ["sh", L.shoulders, 2], ["hp", L.hips, 2], ["LA", L.LA, 2], ["RA", L.RA, 2], ["LL", L.LL, 2.1], ["RL", L.RL, 2.1]].map(([k, d, w]) => body("o" + k, d, w + 1.6, "rgba(0,0,0,0.65)")),
    h("circle", { cx: P.head.x, cy: P.head.y, r: P.headR + 0.8, fill: "rgba(0,0,0,0.65)" }),
    body("torso", L.torso, 2.4, "#F2F0E9"), body("sh", L.shoulders, 2, "#F2F0E9"), body("hp", L.hips, 2, "#F2F0E9"),
    body("LA", L.LA, 2, col("LH")), body("RA", L.RA, 2, col("RH")), body("LL", L.LL, 2.1, col("LF")), body("RL", L.RL, 2.1, col("RF")),
    h("circle", { cx: P.head.x, cy: P.head.y, r: P.headR, fill: "#2A2D27", stroke: "#F2F0E9", strokeWidth: 1.5 }));
}

const stepLabel = (g) => g.map((m) => LIMBS[m.limb].label).join(" + ");

// ---------- player (read-only, animated) ----------
export function BetaPlayer({ photo, beta, onShare }) {
  const moves = (beta && beta.moves) || [];
  const groups = useMemo(() => groupMoves(moves), [moves]);
  const n = groups.length;
  const [step, setStep] = useState(n);
  const [playing, setPlaying] = useState(false);
  const [stick, setStick] = useState(false);
  const [asp, setAsp] = useState(1.33);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setStep((s) => { if (s >= n) { setPlaying(false); return n; } return s + 1; }), 1300);
    return () => clearInterval(t);
  }, [playing, n]);
  const pos = useMemo(() => positionsAt(moves, step), [moves, step]);
  const cur = step > 0 ? groups[step - 1] : null;
  const offs = useMemo(() => spreadOffsets(Object.keys(pos).map((k) => ({ key: k, x: pos[k].x, y: pos[k].y })), asp), [pos, asp]);
  // smooth movement of the stickman between steps
  const [disp, setDisp] = useState({});
  const dispRef = useRef({});
  useEffect(() => {
    if (!stick) return undefined;
    const target = {};
    Object.keys(pos).forEach((k) => { target[k] = { x: pos[k].x, y: pos[k].y }; });
    const from = dispRef.current;
    let raf = 0, t0 = 0;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const t = Math.min(1, (ts - t0) / 700), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const next = {};
      Object.keys(target).forEach((k) => { const f = from[k] || target[k]; next[k] = { x: f.x + (target[k].x - f.x) * e, y: f.y + (target[k].y - f.y) * e }; });
      dispRef.current = next; setDisp(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pos, stick]);
  const u = useMemo(() => bodyScale(moves, asp), [moves, asp]);
  const toggle = () => {
    if (!playing && step >= n) setStep(0);
    setPlaying((p) => !p);
  };
  return h("div", { className: "cl-beta-player" },
    h("div", { className: stick ? "cl-beta-stage dim" : "cl-beta-stage" },
      h("img", { src: photo, alt: "Wall with beta", draggable: false, onLoad: (e) => { if (e.target.naturalWidth) setAsp(e.target.naturalHeight / e.target.naturalWidth); } }),
      !stick && h(Trails, { moves, step, activeGroup: step - 1 }),
      stick && h(Stickman, { disp, asp, u }),
      Object.keys(pos).map((k) => h(Marker, { key: k, m: pos[k], off: offs[k], active: pos[k].gi === step - 1 }))),
    h("div", { className: "cl-beta-controls" },
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }, "aria-label": "Previous move" }, h(ChevronLeft, { size: 18 })),
      h("button", { type: "button", className: "cl-beta-btn primary", onClick: toggle, "aria-label": playing ? "Pause" : "Play" }, playing ? h(Pause, { size: 18 }) : h(Play, { size: 18 })),
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.min(n, s + 1)); }, "aria-label": "Next move" }, h(ChevronRight, { size: 18 })),
      h("input", { type: "range", className: "cl-beta-range", min: 0, max: n, value: step, onChange: (e) => { setPlaying(false); setStep(Number(e.target.value)); }, "aria-label": "Move" }),
      h("span", { className: "cl-beta-count" }, step, "/", n)),
    h("div", { className: "cl-beta-modes" },
      h("button", { type: "button", className: !stick ? "cl-beta-mode active" : "cl-beta-mode", onClick: () => setStick(false) }, "Holds"),
      h("button", { type: "button", className: stick ? "cl-beta-mode active" : "cl-beta-mode", onClick: () => setStick(true) }, h(PersonStanding, { size: 14 }), " Stickman")),
    h("div", { className: "cl-beta-caption" }, cur ? h(React.Fragment, null,
      h("b", null, `Step ${step} \u00B7 ${stepLabel(cur)}`),
      cur.map((m) => h("div", { key: m.id, className: "cl-beta-mline" },
        h("span", { className: "cl-beta-chipc" }, h("i", { style: { background: LIMBS[m.limb].color } }), LIMBS[m.limb].short === "L" ? "Left " : "Right ", LIMBS[m.limb].kind),
        m.color && h("span", { className: "cl-beta-chipc" }, h("i", { style: { background: COLOR_HEX[m.color] || "#888" } }), m.color, " hold"),
        m.tech && TECH_BY_ID[m.tech] && h("span", { className: "cl-beta-tech" }, TECH_BY_ID[m.tech].name, h(TechniqueHelpButton, { id: m.tech })),
        m.note && h("p", null, m.note)))) : h("span", { className: "cl-hint" }, "Press play to watch the beta, or drag the slider.")),
    h(BetaLegend), onShare && h("button", { type: "button", className: "cl-btn-ghost cl-beta-share", onClick: onShare }, "Share beta"));
}

// ---------- editor ----------
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
      setMoves((ms) => ms.map((m, i) => (i === sel ? { ...m, x, y, color } : m)));
      setSel(null);
      return;
    }
    setMoves((ms) => [...ms, { id: rid(), limb, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, color, note: "", tech: null, together: tog && ms.length > 0 }]);
    setTog(false);
    setLimb(NEXT_LIMB[limb]);
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

  const done = () => onSave(moves.length ? { v: 1, color: focus || null, moves: moves.map(({ id, limb: l, x, y, color, note, tech, together }, i) => ({ id, limb: l, x, y, color, note: note || "", tech: tech || null, together: !!(together && i > 0) })) } : null);
  const updateSel = (patch) => setMoves((ms) => ms.map((m, i) => (i === sel ? { ...m, ...patch } : m)));
  const removeSel = () => { setMoves((ms) => ms.filter((_, i) => i !== sel)); setSel(null); };
  const steps = useMemo(() => stepOfMove(moves), [moves]);
  const offs = useMemo(() => spreadOffsets(moves.map((m) => ({ key: m.id, x: m.x, y: m.y })), asp), [moves, asp]);

  return h("div", { className: "cl-overlay cl-layer-top cl-beta-editor" },
    h("div", { className: "cl-overlay-header" },
      h("button", { className: "cl-icon-btn", onClick: onCancel, "aria-label": "Cancel" }, h(ArrowLeft, { size: 20 })),
      h("span", { className: "cl-overlay-title" }, "Build beta"),
      h("button", { className: "cl-icon-btn cl-beta-done", onClick: done, "aria-label": "Done" }, h(Check, { size: 20 }))),
    h("div", { className: "cl-beta-body" },
      h("div", { className: "cl-beta-tools" },
        h("div", { className: "cl-beta-zoom" }, [1, 2, 3].map((z) => h("button", { key: z, type: "button", className: zoom === z ? "active" : "", onClick: () => setZoom(z) }, z === 1 ? h(ZoomIn, { size: 14 }) : null, `${z}×`))),
        state === "loading" && h("span", { className: "cl-hint" }, "Finding holds…"),
        state === "ready" && h("span", { className: "cl-hint" }, h(Sparkles, { size: 12 }), ` ${analysis.holds.length} holds found — tap any hold`)),
      colorCounts.length > 0 && h("div", { className: "cl-beta-colors" },
        h("button", { type: "button", className: !focus ? "cl-beta-color active" : "cl-beta-color", onClick: () => setFocus(null) }, "All"),
        colorCounts.map(([k, c]) => h("button", { key: k, type: "button", className: focus === k ? "cl-beta-color active" : "cl-beta-color", onClick: () => setFocus(focus === k ? null : k) }, h("i", { style: { background: COLOR_HEX[k] } }), k, h("small", null, c)))),
      h("div", { className: "cl-beta-scroll" },
        h("div", {
          className: "cl-beta-stage editing", ref: stageRef, style: { width: `${zoom * 100}%` },
          onPointerDown: (e) => { down.current = { x: e.clientX, y: e.clientY }; },
          onPointerUp: (e) => { const d0 = down.current; down.current = null; if (d0 && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 8) handleTap(e.clientX, e.clientY); },
        },
          h("img", { src: photo, alt: "", draggable: false, onLoad: (e) => { if (e.target.naturalWidth) setAsp(e.target.naturalHeight / e.target.naturalWidth); } }),
          h("canvas", { ref: canvasRef, className: "cl-beta-canvas" }),
          h(Trails, { moves, step: 9999, activeGroup: -1 }),
          moves.map((m, i) => h(Marker, { key: m.id, m, off: offs[m.id], number: steps[i], selected: sel === i, small: zoom === 1 })),
          ping && h("span", { key: ping.k, className: "cl-beta-ping", style: { left: `${ping.x}%`, top: `${ping.y}%` } }))),
      h("div", { className: "cl-beta-limbs" },
        Object.keys(LIMBS).map((k) => h("button", { key: k, type: "button", className: (sel != null ? moves[sel].limb : limb) === k ? "cl-beta-limb active" : "cl-beta-limb", style: (sel != null ? moves[sel].limb : limb) === k ? { borderColor: LIMBS[k].color, color: LIMBS[k].color } : void 0, onClick: () => { if (sel != null) updateSel({ limb: k }); else setLimb(k); } }, h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label))),
      h("div", { className: "cl-beta-moves" },
        moves.length === 0 && h("span", { className: "cl-hint" }, "Pick a limb, then tap the hold it uses. Do your moves in order."),
        moves.map((m, i) => h("button", { key: m.id, type: "button", className: sel === i ? "cl-beta-move active" : "cl-beta-move", onClick: () => setSel(sel === i ? null : i) }, m.together && i > 0 && h("em", null, "+"), h("b", { style: { background: LIMBS[m.limb].color, color: LIMBS[m.limb].ink } }, steps[i]), m.limb, m.tech && h("small", null, TECH_BY_ID[m.tech] ? TECH_BY_ID[m.tech].name : "")))),
      sel == null && moves.length > 0 && h("button", { type: "button", className: tog ? "cl-beta-tog active" : "cl-beta-tog", onClick: () => setTog(!tog) }, h(Link2, { size: 14 }), tog ? " Next tap is the same step as the previous move" : " Same step as previous move? (e.g. matching both hands)"),
      sel != null ? h("div", { className: "cl-beta-edit" },
        h("p", { className: "cl-hint" }, `Step ${steps[sel]} (${LIMBS[moves[sel].limb].label}): tap a limb above to change it, or tap the photo to move it to another hold.`),
        sel > 0 && h("button", { type: "button", className: moves[sel].together ? "cl-beta-tog active" : "cl-beta-tog", onClick: () => updateSel({ together: !moves[sel].together }) }, h(Link2, { size: 14 }), moves[sel].together ? " Same step as the previous move" : " Make this the same step as the previous move"),
        h("p", { className: "cl-section-caption", style: { margin: "6px 0 0" } }, "Technique (tap ? to see how)"),
        h(TechniquePicker, { value: moves[sel].tech || null, onChange: (t) => updateSel({ tech: t }) }),
        h("input", { className: "cl-input", value: moves[sel].note || "", onChange: (e) => updateSel({ note: e.target.value }), placeholder: "Note (e.g. big reach, keep hips in)" }),
        h("button", { type: "button", className: "cl-btn-ghost", onClick: removeSel }, h(Trash2, { size: 14 }), " Delete this move"))
        : h("div", { className: "cl-beta-actions" },
          h("button", { type: "button", className: "cl-btn-ghost", disabled: moves.length === 0, onClick: () => setMoves((ms) => ms.slice(0, -1)) }, h(Undo2, { size: 14 }), " Undo"),
          h("button", { type: "button", className: "cl-btn-primary", style: { marginTop: 0 }, onClick: done }, "Done"))));
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
  const moves = (beta && beta.moves) || [];
  if (!moves.length) return;
  const steps = stepOfMove(moves);
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
