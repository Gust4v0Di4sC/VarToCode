// src/exporters/tailwind.ts
import { kebab, splitSegments, rgbaToCssColor } from "../shared/util";

type Kind =
  | "color"
  | "spacing"
  | "radius"
  | "font"
  | "text"
  | "leading"
  | "tracking"
  | "weight"
  | "other";

function detectKind(segments: string[], resolvedType: string): Kind {
  const head = (segments[0] || "").toLowerCase();

  if (resolvedType === "COLOR") return "color";

  if (resolvedType === "STRING") {
    if (head === "font" || head === "fonts" || head === "typography") return "font";
    return "other";
  }

  if (resolvedType === "FLOAT") {
    if (head === "radius" || head === "radii" || head === "border-radius") return "radius";
    if (head === "text" || head === "font-size" || head === "fontsize") return "text";
    if (head === "leading" || head === "line-height") return "leading";
    if (head === "tracking" || head === "letter-spacing") return "tracking";
    if (head === "weight" || head === "font-weight") return "weight";
    if (head === "spacing" || head === "space" || head === "size" || head === "sizing") return "spacing";
    return "spacing";
  }

  return "other";
}

function dropGroupPrefix(segments: string[], kind: Kind) {
  const s0 = (segments[0] || "").toLowerCase();

  if (kind === "color" && (s0 === "colors" || s0 === "color")) return segments.slice(1);
  if (kind === "spacing" && (s0 === "spacing" || s0 === "space" || s0 === "sizes" || s0 === "size")) return segments.slice(1);
  if (kind === "radius" && s0 === "radius") return segments.slice(1);
  if (kind === "font" && (s0 === "font" || s0 === "fonts" || s0 === "typography")) return segments.slice(1);
  if (kind === "text" && (s0 === "text" || s0 === "font-size" || s0 === "fontsize")) return segments.slice(1);
  if (kind === "leading" && (s0 === "leading" || s0 === "line-height")) return segments.slice(1);
  if (kind === "tracking" && (s0 === "tracking" || s0 === "letter-spacing")) return segments.slice(1);
  if (kind === "weight" && (s0 === "weight" || s0 === "font-weight")) return segments.slice(1);

  return segments;
}

function buildThemeVarName(kind: Kind, segments: string[]) {
  const slug = segments.length ? segments.join("-") : "token";

  if (kind === "color") return `--color-${slug}`;
  if (kind === "spacing") return `--spacing-${slug}`;
  if (kind === "radius") return `--radius-${slug}`;
  if (kind === "font") return `--font-${slug}`;
  if (kind === "text") return `--text-${slug}`;
  if (kind === "leading") return `--leading-${slug}`;
  if (kind === "tracking") return `--tracking-${slug}`;
  if (kind === "weight") return `--font-weight-${slug}`;
  return null;
}

function modeSlug(name: string) {
  const s = kebab(name);
  return s || "mode";
}

/** px->rem (opcional) */
const USE_REM = false;
const PX_PER_REM = 16;

function floatToUnit(n: number) {
  if (!USE_REM) return String(n) + "px";
  const v = n / PX_PER_REM;
  let s = String(Math.round(v * 10000) / 10000);
  if (s.indexOf(".") !== -1) {
    while (s.length && s.charAt(s.length - 1) === "0") s = s.slice(0, -1);
    if (s.length && s.charAt(s.length - 1) === ".") s = s.slice(0, -1);
  }
  return s + "rem";
}

export async function exportTailwindV41Css() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();

  const collectionById: Record<string, any> = {};
  for (let i = 0; i < collections.length; i++) {
    collectionById[collections[i].id] = collections[i];
  }

  // varId -> --theme-var (para resolver aliases)
  const themeVarByVarId: Record<string, string> = {};
  for (let i = 0; i < variables.length; i++) {
    const v: any = variables[i];
    const segments = splitSegments(v.name);
    const kind = detectKind(segments, String(v.resolvedType));
    const cleaned = dropGroupPrefix(segments, kind);
    const tv = buildThemeVarName(kind, cleaned);
    if (tv) themeVarByVarId[v.id] = tv;
  }

  const warnings: string[] = [];

  function valueToCss(v: any, modeId: string): string | null {
    const raw = v.valuesByMode ? v.valuesByMode[modeId] : null;
    if (raw == null) return null;

    if (raw && raw.type === "VARIABLE_ALIAS" && typeof raw.id === "string") {
      const ref = themeVarByVarId[raw.id];
      if (!ref) {
        warnings.push(`Alias não resolvido: "${v.name}" -> varId(${raw.id})`);
        return null;
      }
      return `var(${ref})`;
    }

    if (v.resolvedType === "COLOR") {
      if (raw && typeof raw.r === "number") {
        const a = typeof raw.a === "number" ? raw.a : 1;
        return rgbaToCssColor(raw.r, raw.g, raw.b, a);
      }
      return null;
    }

    if (v.resolvedType === "FLOAT") {
      if (typeof raw === "number") return floatToUnit(raw);
      return null;
    }

    if (v.resolvedType === "STRING") {
      if (typeof raw === "string") return raw;
      return null;
    }

    return null;
  }

  // dedupe + ordenado
  const themeMap: Record<string, string> = {};
  const overridesMapByMode: Record<string, Record<string, string>> = {};

  for (let i = 0; i < variables.length; i++) {
    const v: any = variables[i];
    const segments = splitSegments(v.name);
    const kind = detectKind(segments, String(v.resolvedType));
    const cleaned = dropGroupPrefix(segments, kind);
    const tv = buildThemeVarName(kind, cleaned);
    if (!tv) continue;

    const col = collectionById[v.variableCollectionId];
    if (!col || !col.modes || !col.modes.length) continue;

    const defaultModeId = col.modes[0].modeId;

    const baseVal = valueToCss(v, defaultModeId);
    if (baseVal != null) {
      if (themeMap[tv] && themeMap[tv] !== baseVal) {
        warnings.push(`Conflito: ${tv} foi sobrescrito (variável "${v.name}")`);
      }
      themeMap[tv] = baseVal;
    }

    for (let m = 0; m < col.modes.length; m++) {
      const mode = col.modes[m];
      if (mode.modeId === defaultModeId) continue;

      const val = valueToCss(v, mode.modeId);
      if (val == null) continue;
      if (val === baseVal) continue;

      const slug = modeSlug(mode.name);
      if (!overridesMapByMode[slug]) overridesMapByMode[slug] = {};
      overridesMapByMode[slug][tv] = val;
    }
  }

  const themeKeys = Object.keys(themeMap).sort();
  const modeKeys = Object.keys(overridesMapByMode).sort();

  const out: string[] = [];
  out.push("/* figma.tokens.css — Tailwind v4.1 (CSS-first) */");
  out.push('/* Uso: @import "tailwindcss"; @import "./figma.tokens.css"; */');
  out.push("");
  out.push("@theme {");
  if (!themeKeys.length) {
    out.push("  /* (nenhum token exportável) */");
  } else {
    for (let i = 0; i < themeKeys.length; i++) {
      const k = themeKeys[i];
      out.push(`  ${k}: ${themeMap[k]};`);
    }
  }
  out.push("}");
  out.push("");

  if (modeKeys.length) {
    out.push("@layer base {");
    for (let i = 0; i < modeKeys.length; i++) {
      const slug = modeKeys[i];
      const kv = overridesMapByMode[slug];
      const keys = Object.keys(kv).sort();
      out.push(`  [data-theme="${slug}"] {`);
      for (let j = 0; j < keys.length; j++) {
        const tv = keys[j];
        out.push(`    ${tv}: ${kv[tv]};`);
      }
      out.push("  }");
      out.push("");
    }
    out.push("}");
    out.push("");
  }

  if (warnings.length) {
    out.push("/* Warnings */");
    for (let i = 0; i < warnings.length; i++) out.push(`/* - ${warnings[i]} */`);
  }

  return out.join("\n");
}
