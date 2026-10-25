// Hold detection for climbing-wall photos. Pure functions on ImageData-like objects ({ data, width, height }).
// Works for coloured holds on a grey wall; white/black/grey holds are found by tapping (region growing).

export const COLOR_NAMES = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "white", "black", "grey"];
export const COLOR_HEX = { red: "#E0332B", orange: "#F28A1E", yellow: "#F2C81E", green: "#2E9E4F", blue: "#2F6FE0", purple: "#8A44C8", pink: "#F0488F", white: "#F4F1E8", black: "#1B1B1B", grey: "#8E8E8E" };

export function rgb2hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max / 255];
}

const srgb2lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const labF = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
export function rgb2lab(r, g, b) {
  const R = srgb2lin(r), G = srgb2lin(g), B = srgb2lin(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const fx = labF(X), fy = labF(Y), fz = labF(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function nameColor(h, s, v) {
  if (v < 0.2) return "black";
  if (s < 0.2) return v > 0.72 ? "white" : "grey";
  if (h >= 352 || h < 9) return "red";
  if (h < 38) return "orange";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 258) return "blue";
  if (h < 312) return "purple";
  return "pink";
}

// Scale an <img>/<canvas> to a working size and return ImageData.
export function toImageData(source, maxSide = 640) {
  const sw = source.naturalWidth || source.width, sh = source.naturalHeight || source.height;
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function dilate(mask, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx >= 0 && xx < w) out[yy * w + xx] = 1; } }
  }
  return out;
}
function erode(mask, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    let ok = true;
    for (let dy = -r; dy <= r && ok; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) { ok = false; break; } for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx < 0 || xx >= w || !mask[yy * w + xx]) { ok = false; break; } } }
    if (ok) out[y * w + x] = 1;
  }
  return out;
}

// Find coloured holds. Returns { holds, labels, width, height } where labels[i] = hold index + 1 (0 = none).
export function detectHolds(img, opts = {}) {
  const { width: w, height: h, data } = img;
  const total = w * h;
  const minArea = opts.minArea || Math.max(40, Math.round(total * 0.00035));
  const maxArea = opts.maxArea || Math.round(total * 0.2);
  const hsv = new Float32Array(total * 3);
  const lab = new Float32Array(total * 3);
  const mask = new Uint8Array(total);
  for (let i = 0, p = 0; i < total; i++, p += 4) {
    const [hh, ss, vv] = rgb2hsv(data[p], data[p + 1], data[p + 2]);
    hsv[i * 3] = hh; hsv[i * 3 + 1] = ss; hsv[i * 3 + 2] = vv;
    const [L, A, B] = rgb2lab(data[p], data[p + 1], data[p + 2]);
    lab[i * 3] = L; lab[i * 3 + 1] = A; lab[i * 3 + 2] = B;
  }
  // the wall (and floor) are close to the image's median chroma; holds stand out from it
  const med = (k) => { const v = []; for (let i = 0; i < total; i += 7) v.push(lab[i * 3 + k]); v.sort((a, b) => a - b); return v[(v.length / 2) | 0]; };
  const a0 = med(1), b0 = med(2);
  const thr = opts.chromaThreshold || 17;
  for (let i = 0; i < total; i++) {
    const L = lab[i * 3], dc = Math.hypot(lab[i * 3 + 1] - a0, lab[i * 3 + 2] - b0);
    if (L > 14 && dc >= (L < 45 ? thr - 3 : thr)) mask[i] = 1;
  }
  const closed = erode(dilate(mask, w, h, 2), w, h, 2);
  const opened = dilate(erode(closed, w, h, 1), w, h, 1);
  const labels = new Int32Array(total);
  const holds = [];
  const stack = new Int32Array(total);
  for (let s = 0; s < total; s++) {
    if (!opened[s] || labels[s]) continue;
    let sp = 0, count = 0, sx = 0, sy = 0, minX = w, minY = h, maxX = 0, maxY = 0;
    const id = holds.length + 1;
    const pix = [];
    stack[sp++] = s; labels[s] = id;
    while (sp) {
      const i = stack[--sp];
      const x = i % w, y = (i / w) | 0;
      count++; sx += x; sy += y; pix.push(i);
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (opened[j] && !labels[j]) { labels[j] = id; stack[sp++] = j; }
      }
    }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    if (count < minArea || count > maxArea || Math.min(bw, bh) < 4) { for (const i of pix) labels[i] = 0; continue; }
    // dominant colour: median hue / mean sat+val over the component's coloured pixels
    const hs = [];
    let ss = 0, vv = 0;
    for (const i of pix) { hs.push(hsv[i * 3]); ss += hsv[i * 3 + 1]; vv += hsv[i * 3 + 2]; }
    // circular median around the first hue
    const ref = hs[0];
    const rel = hs.map((x) => { let d = x - ref; if (d > 180) d -= 360; if (d < -180) d += 360; return d; }).sort((a, b) => a - b);
    let hue = (ref + rel[(rel.length / 2) | 0] + 360) % 360;
    const color = nameColor(hue, ss / count, vv / count);
    holds.push({ id, color, hue, sat: ss / count, val: vv / count, area: count, cx: sx / count / w, cy: sy / count / h, x0: minX / w, y0: minY / h, x1: (maxX + 1) / w, y1: (maxY + 1) / h });
  }
  // renumber so ids are 1..n after filtering
  const remap = new Map();
  holds.forEach((hd, i) => remap.set(hd.id, i + 1));
  for (let i = 0; i < total; i++) if (labels[i]) labels[i] = remap.get(labels[i]) || 0;
  holds.forEach((hd, i) => { hd.id = i + 1; });
  return { holds, labels, width: w, height: h };
}

// Tap on something detection missed (white / black / grey holds): grow a region from the tapped pixel.
export function growHoldAt(img, px, py, opts = {}) {
  const { width: w, height: h, data } = img;
  const tol = opts.tol || 40, maxR = opts.maxR || Math.round(Math.max(w, h) * 0.12), maxArea = opts.maxArea || Math.round(w * h * 0.04);
  const x0 = Math.max(0, Math.min(w - 1, Math.round(px))), y0 = Math.max(0, Math.min(h - 1, Math.round(py)));
  // seed colour = mean of a 5x5 patch
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = (y * w + x) * 4; r += data[p]; g += data[p + 1]; b += data[p + 2]; n++;
  }
  r /= n; g /= n; b /= n;
  const seen = new Uint8Array(w * h), out = [];
  const stack = [y0 * w + x0]; seen[y0 * w + x0] = 1;
  let sx = 0, sy = 0, minX = w, minY = h, maxX = 0, maxY = 0;
  while (stack.length && out.length < maxArea) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    const p = i * 4;
    const d = Math.abs(data[p] - r) + Math.abs(data[p + 1] - g) + Math.abs(data[p + 2] - b);
    if (d > tol * 2) continue;
    if ((x - x0) * (x - x0) + (y - y0) * (y - y0) > maxR * maxR) continue;
    out.push(i); sx += x; sy += y;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (x > 0 && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
    if (x < w - 1 && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
    if (y > 0 && !seen[i - w]) { seen[i - w] = 1; stack.push(i - w); }
    if (y < h - 1 && !seen[i + w]) { seen[i + w] = 1; stack.push(i + w); }
  }
  if (out.length < 25) return null;
  const [hh, ss, vv] = rgb2hsv(r, g, b);
  return { pixels: out, color: nameColor(hh, ss, vv), cx: sx / out.length / w, cy: sy / out.length / h, x0: minX / w, y0: minY / h, x1: (maxX + 1) / w, y1: (maxY + 1) / h, area: out.length, width: w, height: h };
}
