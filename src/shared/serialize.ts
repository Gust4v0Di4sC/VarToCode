// src/shared/serialize.ts
import { isOwn, rgbaToHex } from "./util";

export function serializeVariableValueAsJson(value: any) {
  if (value == null) return null;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;

  if (value && value.type === "VARIABLE_ALIAS" && typeof value.id === "string") {
    return { type: "alias", id: value.id };
  }

  if (
    value &&
    typeof value.r === "number" &&
    typeof value.g === "number" &&
    typeof value.b === "number"
  ) {
    const a = typeof value.a === "number" ? value.a : 1;
    return {
      type: "color",
      hex: rgbaToHex(value.r, value.g, value.b, a),
      rgba: { r: value.r, g: value.g, b: value.b, a: a },
    };
  }

  return value;
}

export function serializeValuesByModeAsJson(valuesByMode: any) {
  const src = valuesByMode || {};
  const out: Record<string, any> = {};
  for (const modeId in src) {
    if (!isOwn(src, modeId)) continue;
    out[modeId] = serializeVariableValueAsJson(src[modeId]);
  }
  return out;
}
