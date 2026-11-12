// Turns tracked body landmarks (one set per video frame) into beta moves:
// a limb that stays on one spot for a moment is "on a hold"; each new spot is a move, in the order they happen.
// Landmarks follow the MediaPipe Pose numbering (33 points, x/y from 0 to 1 of the frame).
const LIMB_POINTS = { LH: [15, 19], RH: [16, 20], LF: [31, 27], RF: [32, 28] };
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

function limbPoint(lm, ids, minVis) {
  let x = 0, y = 0, n = 0;
  ids.forEach((i) => { const p = lm[i]; if (p && (p.visibility == null || p.visibility >= minVis)) { x += p.x; y += p.y; n++; } });
  return n ? { x: x / n, y: y / n } : null;
}

// frames: [{ t: seconds, lm: landmarks[] | null }], aspect = frame height / width
export function tracksToMoves(frames, aspect = 1.78, opts = {}) {
  const minVis = opts.minVis == null ? 0.5 : opts.minVis;
  const minDur = opts.minDur == null ? 0.6 : opts.minDur; // seconds a limb must rest to count as a hold
  const seen = frames.filter((f) => f.lm);
  if (seen.length < 3) return { moves: [], holds: [], detected: seen.length };
  // body size (shoulders to hips) in "frame widths", to make the thresholds independent of how big the climber is in the frame
  const torso = median(seen.map((f) => {
    const l = f.lm, sx = (l[11].x + l[12].x) / 2, sy = (l[11].y + l[12].y) / 2, hx = (l[23].x + l[24].x) / 2, hy = (l[23].y + l[24].y) / 2;
    return Math.hypot(sx - hx, (sy - hy) * aspect);
  })) || 0.15;
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * aspect);
  const holds = [];
  Object.keys(LIMB_POINTS).forEach((limb) => {
    const radius = torso * (limb[1] === "H" ? 0.2 : 0.22);
    let cl = null; // { sx, sy, n, t0, t1 }
    const close = () => { if (cl && cl.t1 - cl.t0 >= minDur && cl.n >= 2) holds.push({ limb, x: cl.sx / cl.n, y: cl.sy / cl.n, t0: cl.t0, t1: cl.t1 }); cl = null; };
    let lastSeen = -1e9;
    frames.forEach((f) => {
      const p = f.lm ? limbPoint(f.lm, LIMB_POINTS[limb], minVis) : null;
      if (!p) { if (cl && f.t - lastSeen > 1.2) close(); return; } // hidden for a while: stop the current rest
      lastSeen = f.t;
      if (cl && dist(p, { x: cl.sx / cl.n, y: cl.sy / cl.n }) <= radius) { cl.sx += p.x; cl.sy += p.y; cl.n++; cl.t1 = f.t; }
      else { close(); cl = { sx: p.x, sy: p.y, n: 1, t0: f.t, t1: f.t }; }
    });
    close();
  });
  // a limb that leaves a hold and comes back to (almost) the same spot did not really move
  const merged = [];
  holds.sort((a, b) => a.t0 - b.t0).forEach((hd) => {
    const prev = merged.slice().reverse().find((m) => m.limb === hd.limb);
    if (prev && dist(prev, hd) < torso * 0.3) { prev.t1 = hd.t1; return; }
    merged.push({ ...hd });
  });
  const rid = () => Math.random().toString(36).slice(2, 9);
  const moves = merged.map((hd, i) => ({
    id: rid(), limb: hd.limb, surf: "hold", color: null, note: "", tech: null,
    x: Math.round(Math.max(0, Math.min(1, hd.x)) * 1000) / 10, y: Math.round(Math.max(0, Math.min(1, hd.y)) * 1000) / 10,
    together: i > 0 && hd.limb !== merged[i - 1].limb && hd.t0 - merged[i - 1].t0 < 0.45,
  }));
  return { moves, holds: merged, detected: seen.length, torso };
}

// per-pixel median of several frames: the climber moves, the wall does not, so the climber mostly disappears
export function medianImage(datas, w, h) {
  const n = datas.length, out = new Uint8ClampedArray(w * h * 4), buf = new Uint8Array(n), mid = Math.floor(n / 2);
  for (let i = 0; i < w * h * 4; i++) {
    if ((i & 3) === 3) { out[i] = 255; continue; }
    for (let k = 0; k < n; k++) buf[k] = datas[k][i];
    buf.sort();
    out[i] = buf[mid];
  }
  return out;
}
