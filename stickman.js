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
  const B = BODY;
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
    for (let pass = 0; pass < 8; pass++) {
      const r = roots(C);
      const limbs = [[targets.LH, r.LS, arm], [targets.RH, r.RS, arm], [targets.LF, r.LP, leg], [targets.RF, r.RP, leg]];
      limbs.forEach(([t, root, len]) => {
        if (!t) return;
        const d = dist(root, t);
        if (d > len) { const k = ((d - len) / d) * 0.7; C = { x: C.x + (t.x - root.x) * k, y: C.y + (t.y - root.y) * k }; }
      });
    }
  }
  const r = roots(C);
  const cx = C.x;
  const reach = (t, root, l1, l2, side) => (t ? t : { x: root.x + side * 0.25 * u, y: root.y + (l1 + l2) * 0.85 * u });
  const LHt = reach(targets.LH, r.LS, B.upperArm, B.foreArm, -1), RHt = reach(targets.RH, r.RS, B.upperArm, B.foreArm, 1);
  const LFt = reach(targets.LF, r.LP, B.thigh, B.shin, -1), RFt = reach(targets.RF, r.RP, B.thigh, B.shin, 1);
  const o = opts;
  return {
    head: { x: r.neck.x, y: r.neck.y - 0.42 * u }, headR: B.head * u, neck: r.neck, hip: C,
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
