// Beta builder + player: mark which hold each hand/foot uses, in order, and replay it step by step.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Play, Pause, Undo2, Trash2, Check, ChevronLeft, ChevronRight, ZoomIn, Sparkles, X } from "lucide-react";
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

// where every limb is after `step` moves
export function positionsAt(moves, step) {
  const pos = {};
  moves.slice(0, step).forEach((m, i) => { pos[m.limb] = { ...m, i }; });
  return pos;
}

function Marker({ m, number, selected, active, small }) {
  const L = LIMBS[m.limb];
  return h("div", {
    className: `cl-beta-mk ${L.kind}${selected ? " selected" : ""}${active ? " active" : ""}${small ? " small" : ""}`,
    style: { left: `${m.x}%`, top: `${m.y}%`, background: L.color, color: L.ink },
  }, h("span", null, L.short), number != null && h("i", null, number));
}

function Trails({ moves, step, activeIdx }) {
  const upto = moves.slice(0, step);
  const hands = upto.filter((m) => LIMBS[m.limb].kind === "hand");
  const prev = {};
  let seg = null;
  upto.forEach((m, i) => { if (i === activeIdx && prev[m.limb]) seg = { a: prev[m.limb], b: m, color: LIMBS[m.limb].color }; prev[m.limb] = m; });
  return h("svg", { className: "cl-beta-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none" },
    hands.length > 1 && h("polyline", { points: hands.map((m) => `${m.x},${m.y}`).join(" "), fill: "none", stroke: "rgba(255,255,255,0.55)", strokeWidth: 2, strokeDasharray: "4 3", vectorEffect: "non-scaling-stroke", strokeLinecap: "round", strokeLinejoin: "round" }),
    seg && h("line", { x1: seg.a.x, y1: seg.a.y, x2: seg.b.x, y2: seg.b.y, stroke: seg.color, strokeWidth: 3.5, vectorEffect: "non-scaling-stroke", strokeLinecap: "round" }));
}

export function BetaLegend() {
  return h("div", { className: "cl-beta-legend" }, Object.keys(LIMBS).map((k) => h("span", { key: k }, h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label)));
}

// ---------- player (read-only, animated) ----------
export function BetaPlayer({ photo, beta, onShare }) {
  const moves = (beta && beta.moves) || [];
  const n = moves.length;
  const [step, setStep] = useState(n);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setStep((s) => { if (s >= n) { setPlaying(false); return n; } return s + 1; }), 1100);
    return () => clearInterval(t);
  }, [playing, n]);
  const pos = useMemo(() => positionsAt(moves, step), [moves, step]);
  const cur = step > 0 ? moves[step - 1] : null;
  const toggle = () => {
    if (!playing && step >= n) setStep(0);
    setPlaying((p) => !p);
  };
  return h("div", { className: "cl-beta-player" },
    h("div", { className: "cl-beta-stage" },
      h("img", { src: photo, alt: "Wall with beta", draggable: false }),
      h(Trails, { moves, step, activeIdx: step - 1 }),
      Object.keys(pos).map((k) => h(Marker, { key: k, m: pos[k], active: pos[k].i === step - 1 }))),
    h("div", { className: "cl-beta-controls" },
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }, "aria-label": "Previous move" }, h(ChevronLeft, { size: 18 })),
      h("button", { type: "button", className: "cl-beta-btn primary", onClick: toggle, "aria-label": playing ? "Pause" : "Play" }, playing ? h(Pause, { size: 18 }) : h(Play, { size: 18 })),
      h("button", { type: "button", className: "cl-beta-btn", onClick: () => { setPlaying(false); setStep((s) => Math.min(n, s + 1)); }, "aria-label": "Next move" }, h(ChevronRight, { size: 18 })),
      h("input", { type: "range", className: "cl-beta-range", min: 0, max: n, value: step, onChange: (e) => { setPlaying(false); setStep(Number(e.target.value)); }, "aria-label": "Move" }),
      h("span", { className: "cl-beta-count" }, step, "/", n)),
    h("div", { className: "cl-beta-caption" }, cur ? h(React.Fragment, null,
      h("b", { style: { color: LIMBS[cur.limb].color } }, `Move ${step} · ${LIMBS[cur.limb].label}`),
      cur.color && h("span", { className: "cl-beta-chipc" }, h("i", { style: { background: COLOR_HEX[cur.color] || "#888" } }), cur.color, " hold"),
      cur.note && h("p", null, cur.note)) : h("span", { className: "cl-hint" }, "Press play to watch the beta, or drag the slider.")),
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
    setMoves((ms) => [...ms, { id: rid(), limb, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, color, note: "" }]);
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

  const done = () => onSave(moves.length ? { v: 1, color: focus || null, moves: moves.map(({ id, limb: l, x, y, color, note }) => ({ id, limb: l, x, y, color, note: note || "" })) } : null);
  const updateSel = (patch) => setMoves((ms) => ms.map((m, i) => (i === sel ? { ...m, ...patch } : m)));
  const removeSel = () => { setMoves((ms) => ms.filter((_, i) => i !== sel)); setSel(null); };

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
          h("img", { src: photo, alt: "", draggable: false }),
          h("canvas", { ref: canvasRef, className: "cl-beta-canvas" }),
          h(Trails, { moves, step: moves.length, activeIdx: -1 }),
          moves.map((m, i) => h(Marker, { key: m.id, m, number: i + 1, selected: sel === i, small: zoom === 1 })),
          ping && h("span", { key: ping.k, className: "cl-beta-ping", style: { left: `${ping.x}%`, top: `${ping.y}%` } }))),
      h("div", { className: "cl-beta-limbs" },
        Object.keys(LIMBS).map((k) => h("button", { key: k, type: "button", className: (sel != null ? moves[sel].limb : limb) === k ? "cl-beta-limb active" : "cl-beta-limb", style: (sel != null ? moves[sel].limb : limb) === k ? { borderColor: LIMBS[k].color, color: LIMBS[k].color } : void 0, onClick: () => { if (sel != null) updateSel({ limb: k }); else setLimb(k); } }, h("b", { className: `cl-beta-dot ${LIMBS[k].kind}`, style: { background: LIMBS[k].color } }), LIMBS[k].label))),
      h("div", { className: "cl-beta-moves" },
        moves.length === 0 && h("span", { className: "cl-hint" }, "Pick a limb, then tap the hold it uses. Do your moves in order."),
        moves.map((m, i) => h("button", { key: m.id, type: "button", className: sel === i ? "cl-beta-move active" : "cl-beta-move", onClick: () => setSel(sel === i ? null : i) }, h("b", { style: { background: LIMBS[m.limb].color, color: LIMBS[m.limb].ink } }, i + 1), m.limb))),
      sel != null ? h("div", { className: "cl-beta-edit" },
        h("p", { className: "cl-hint" }, `Move ${sel + 1}: tap a limb above to change it, or tap the photo to move it to another hold.`),
        h("input", { className: "cl-input", value: moves[sel].note || "", onChange: (e) => updateSel({ note: e.target.value }), placeholder: "Note (e.g. heel hook, big reach)" }),
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
  const P = (m) => ({
    x: Math.min(view.x + view.w - 14 * k, Math.max(view.x + 14 * k, imgRect.x + (m.x / 100) * imgRect.w)),
    y: Math.min(view.y + view.h - 14 * k, Math.max(view.y + 14 * k, imgRect.y + (m.y / 100) * imgRect.h)),
  });
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const hands = moves.filter((m) => LIMBS[m.limb].kind === "hand").map(P);
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
    const p = P(m), L = LIMBS[m.limb], r = (L.kind === "hand" ? 13 : 11) * k;
    ctx.fillStyle = L.color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5 * k;
    ctx.beginPath();
    if (L.kind === "hand") ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    else { const q = r * 0.95; ctx.roundRect ? ctx.roundRect(p.x - q, p.y - q, q * 2, q * 2, 5 * k) : ctx.rect(p.x - q, p.y - q, q * 2, q * 2); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = L.ink; ctx.font = `800 ${12 * k}px sans-serif`; ctx.textAlign = "center";
    ctx.fillText(String(i + 1), p.x, p.y + 4.2 * k);
  });
  ctx.restore();
}
