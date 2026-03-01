// src/shared/util.ts
export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function kebab(input: string) {
  const s = String(input || "").trim().toLowerCase();
  return s
    .replace(/[\s\/\.]+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function splitSegments(name: string) {
  const raw = String(name || "");
  const parts = raw.split(/[\/\.]+/g);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = kebab(parts[i]);
    if (p) out.push(p);
  }
  return out.length ? out : ["token"];
}

export function pad2(hex: string) {
  return hex.length >= 2 ? hex : "0" + hex;
}

export function rgbaToHex(r: number, g: number, b: number, a: number) {
  const R = pad2(Math.round(clamp01(r) * 255).toString(16));
  const G = pad2(Math.round(clamp01(g) * 255).toString(16));
  const B = pad2(Math.round(clamp01(b) * 255).toString(16));
  const A = pad2(Math.round(clamp01(a) * 255).toString(16));
  return a >= 0.999 ? ("#" + R + G + B) : ("#" + R + G + B + A);
}

// Para CSS: evita #RRGGBBAA -> usa rgb(r g b / a) quando alpha != 1
export function rgbaToCssColor(r: number, g: number, b: number, a: number) {
  const R = Math.round(clamp01(r) * 255);
  const G = Math.round(clamp01(g) * 255);
  const B = Math.round(clamp01(b) * 255);
  const A = clamp01(a);
  if (A >= 0.999) return rgbaToHex(r, g, b, 1);
  const aStr = String(Math.round(A * 1000) / 1000);
  return `rgb(${R} ${G} ${B} / ${aStr})`;
}

export function isOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function safeMixed(v: any) {
  // depende do runtime do figma (sentinela)
  return v === figma.mixed ? null : v;
}
