// Stick figure for climbing beta: given where each hand/foot is, work out a plausible body pose (2-bone IK).
const mean = (pts) => (pts.length ? { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length } : null);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// two-bone IK: returns the middle joint (elbow / knee) for a limb from `root` to `target`
function twoBone(root, target, l1, l2, side, outward) {
  const d = Math.max(1e-6, dist(root, target));
  if (d >= l1 + l2 - 1e-6) return lerp(root, target, l1 / (l1 + l2));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = (target.x - root.x) / d, uy = (target.y - root.y) / d;
  const px = root.x + ux * a, py = root.y + uy * a;
  const c1 = { x: px - uy * hh, y: py + ux * hh }, c2 = { x: px + uy * hh, y: py - ux * hh };
  // bend away from the body's centre line, and prefer elbows/knees that point outward-down
  const score = (c) => Math.abs(c.x - outward) * 1.0 + (side < 0 ? -c.x : c.x) * 0.2 + c.y * 0.05;
  return score(c1) >= score(c2) ? c1 : c2;
}

export const BODY = { torso: 1.05, shoulder: 0.3, hip: 0.18, upperArm: 0.55, foreArm: 0.52, thigh: 0.62, shin: 0.6, head: 0.27 };

// targets: { LH, RH, LF, RF } each {x,y} or undefined. u = body scale. opts.hip / opts.knees / opts.elbows optional overrides.
export function solvePose(targets, u, opts = {}) {
  const ak = opts.armK || 1, lk = opts.legK || 1, tk = opts.torsoK || 1;
  const B = { ...BODY, upperArm: BODY.upperArm * ak, foreArm: BODY.foreArm * ak, thigh: BODY.thigh * lk, shin: BODY.shin * lk, torso: BODY.torso * tk };
  const hands = [targets.LH, targets.RH].filter(Boolean), feet = [targets.LF, targets.RF].filter(Boolean);
  const hm = mean(hands), fm = mean(feet);
  let C; // hip centre
  if (opts.hip) C = { ...opts.hip };
  else if (hm && fm) C = lerp(fm, hm, 0.5);
  else if (hm) C = { x: hm.x, y: hm.y + 1.75 * u };
  else if (fm) C = { x: fm.x, y: fm.y - 1.5 * u };
  else C = { x: 50, y: 50 };
  const arm = (B.upperArm + B.foreArm) * u, leg = (B.thigh + B.shin) * u;
  const roots = (c) => {
    const lean = hm ? Math.max(-0.3 * u, Math.min(0.3 * u, (hm.x - c.x) * 0.3)) : 0;
    const neck = { x: c.x + lean, y: c.y - B.torso * u };
    return {
      neck,
      LS: { x: neck.x - B.shoulder * u, y: neck.y + 0.06 * u }, RS: { x: neck.x + B.shoulder * u, y: neck.y + 0.06 * u },
      LP: { x: c.x - B.hip * u, y: c.y }, RP: { x: c.x + B.hip * u, y: c.y },
    };
  };
  if (!opts.hip) {
    for (let pass = 0; pass < 30; pass++) {
      const r = roots(C);
      const limbs = [[targets.LH, r.LS, arm], [targets.RH, r.RS, arm], [targets.LF, r.LP, leg], [targets.RF, r.RP, leg]];
      let dx = 0, dy = 0, n = 0;
      limbs.forEach(([t, root, len]) => {
        if (!t) return;
        const d = dist(root, t);
        if (d > len * 0.99) { const k = (d - len * 0.99) / d; dx += (t.x - root.x) * k; dy += (t.y - root.y) * k; n++; }
      });
      if (!n) break;
      C = { x: C.x + dx / n, y: C.y + dy / n };
    }
  }
  const r = roots(C);
  const cx = C.x;
  let over = false;
  // limbs never stretch: a hold that is out of reach is left just short of it with the limb straight
  const fit = (t, root, len) => {
    const d = dist(root, t);
    if (d <= len * 0.999) return t;
    over = true;
    return lerp(root, t, (len * 0.999) / d);
  };
  // free (off the wall) limbs hang down, or point sideways when dir is -1 / 1 (flagging)
  const free = (root, len, side, dir) => {
    const v = dir ? { x: dir * 0.9, y: 0.45 } : { x: side * 0.22, y: 0.97 };
    const m = Math.hypot(v.x, v.y);
    return { x: root.x + (v.x / m) * len * 0.96, y: root.y + (v.y / m) * len * 0.96 };
  };
  const fr = opts.freeDir || {};
  const LHt = targets.LH ? fit(targets.LH, r.LS, arm) : free(r.LS, arm, -1, fr.LH), RHt = targets.RH ? fit(targets.RH, r.RS, arm) : free(r.RS, arm, 1, fr.RH);
  const LFt = targets.LF ? fit(targets.LF, r.LP, leg) : free(r.LP, leg, -1, fr.LF), RFt = targets.RF ? fit(targets.RF, r.RP, leg) : free(r.RP, leg, 1, fr.RF);
  const o = opts;
  return {
    head: { x: r.neck.x, y: r.neck.y - 0.42 * u }, headR: B.head * u, neck: r.neck, hip: C, over,
    LS: r.LS, RS: r.RS, LP: r.LP, RP: r.RP,
    LE: (o.elbows && o.elbows.L) || twoBone(r.LS, LHt, B.upperArm * u, B.foreArm * u, -1, cx), RE: (o.elbows && o.elbows.R) || twoBone(r.RS, RHt, B.upperArm * u, B.foreArm * u, 1, cx),
    LK: (o.knees && o.knees.L) || twoBone(r.LP, LFt, B.thigh * u, B.shin * u, -1, cx), RK: (o.knees && o.knees.R) || twoBone(r.RP, RFt, B.thigh * u, B.shin * u, 1, cx),
    LH: LHt, RH: RHt, LF: LFt, RF: RFt, free: { LH: !targets.LH, RH: !targets.RH, LF: !targets.LF, RF: !targets.RF },
  };
}

// SVG path helpers
const pt = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
export function poseLines(P) {
  return {
    torso: `M${pt(P.neck)} L${pt(P.hip)}`,
    shoulders: `M${pt(P.LS)} L${pt(P.RS)}`,
    hips: `M${pt(P.LP)} L${pt(P.RP)}`,
    LA: `M${pt(P.LS)} L${pt(P.LE)} L${pt(P.LH)}`, RA: `M${pt(P.RS)} L${pt(P.RE)} L${pt(P.RH)}`,
    LL: `M${pt(P.LP)} L${pt(P.LK)} L${pt(P.LF)}`, RL: `M${pt(P.RP)} L${pt(P.RK)} L${pt(P.RF)}`,
  };
}
