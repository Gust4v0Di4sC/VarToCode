// src/exporters/styles.ts
import { isOwn, rgbaToHex, safeMixed } from "../shared/util";

function paintToJson(paint: any) {
  const base: any = { type: paint.type, visible: paint.visible, opacity: paint.opacity };

  if (paint.type === "SOLID" && paint.color) {
    const a = typeof paint.opacity === "number" ? paint.opacity : 1;
    base.hex = rgbaToHex(paint.color.r, paint.color.g, paint.color.b, a);
    base.color = paint.color;
    return base;
  }

  for (const k in paint) {
    if (!isOwn(paint, k)) continue;
    if (k === "color") continue;
    if (k === "opacity") continue;
    base[k] = paint[k];
  }
  return base;
}

function normalizePaintArray(paints: any) {
  if (!paints || paints === figma.mixed) return [];
  const arr = Array.isArray(paints) ? paints : [];
  return arr.map(paintToJson);
}

function computeStyleFromNode(field: string, node: any) {
  if (field === "fill") return { fills: normalizePaintArray(node.fills) };
  if (field === "stroke") {
    return {
      strokes: normalizePaintArray(node.strokes),
      strokeWeight: safeMixed(node.strokeWeight),
    };
  }
  if (field === "background") return { background: normalizePaintArray(node.backgrounds) };
  if (field === "effect") return { effects: node.effects || [] };
  if (field === "grid") return { layoutGrids: node.layoutGrids || [] };
  if (field === "text") {
    return {
      fontName: safeMixed(node.fontName),
      fontSize: safeMixed(node.fontSize),
      lineHeight: safeMixed(node.lineHeight),
      letterSpacing: safeMixed(node.letterSpacing),
      paragraphSpacing: safeMixed(node.paragraphSpacing),
      textCase: safeMixed(node.textCase),
      textDecoration: safeMixed(node.textDecoration),
    };
  }
  return null;
}

function serializeStyleObject(style: any, consumerInfo: any) {
  const t = String(style.styleType || style.type || "").toUpperCase();

  if (t === "PAINT") {
    return {
      id: style.id,
      key: style.key,
      name: style.name,
      description: style.description || "",
      styleType: "PAINT",
      remote: !!style.remote,
      consumers: consumerInfo,
      paints: (style.paints || []).map(paintToJson),
    };
  }

  if (t === "TEXT") {
    return {
      id: style.id,
      key: style.key,
      name: style.name,
      description: style.description || "",
      styleType: "TEXT",
      remote: !!style.remote,
      consumers: consumerInfo,
      fontName: style.fontName,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      paragraphSpacing: style.paragraphSpacing,
      textCase: style.textCase,
      textDecoration: style.textDecoration,
    };
  }

  if (t === "EFFECT") {
    return {
      id: style.id,
      key: style.key,
      name: style.name,
      description: style.description || "",
      styleType: "EFFECT",
      remote: !!style.remote,
      consumers: consumerInfo,
      effects: style.effects || [],
    };
  }

  if (t === "GRID") {
    return {
      id: style.id,
      key: style.key,
      name: style.name,
      description: style.description || "",
      styleType: "GRID",
      remote: !!style.remote,
      consumers: consumerInfo,
      layoutGrids: style.layoutGrids || [],
    };
  }

  return {
    id: style.id,
    key: style.key,
    name: style.name,
    styleType: t || "UNKNOWN",
    remote: !!style.remote,
    consumers: consumerInfo,
  };
}

async function exportLocalStylesJson() {
  const hasAll = typeof (figma as any).getLocalStylesAsync === "function";

  if (hasAll) {
    const all = await (figma as any).getLocalStylesAsync();

    const paint: any[] = [];
    const text: any[] = [];
    const effect: any[] = [];
    const grid: any[] = [];

    for (let i = 0; i < all.length; i++) {
      const s: any = all[i];
      const t = String(s.styleType || "").toUpperCase();

      if (t === "PAINT") {
        paint.push({
          id: s.id,
          key: s.key,
          name: s.name,
          description: s.description || "",
          remote: !!s.remote,
          paints: (s.paints || []).map(paintToJson),
        });
      } else if (t === "TEXT") {
        text.push({
          id: s.id,
          key: s.key,
          name: s.name,
          description: s.description || "",
          remote: !!s.remote,
          fontName: s.fontName,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          paragraphSpacing: s.paragraphSpacing,
          textCase: s.textCase,
          textDecoration: s.textDecoration,
        });
      } else if (t === "EFFECT") {
        effect.push({
          id: s.id,
          key: s.key,
          name: s.name,
          description: s.description || "",
          remote: !!s.remote,
          effects: s.effects || [],
        });
      } else if (t === "GRID") {
        grid.push({
          id: s.id,
          key: s.key,
          name: s.name,
          description: s.description || "",
          remote: !!s.remote,
          layoutGrids: s.layoutGrids || [],
        });
      }
    }

    return { paint, text, effect, grid };
  }

  // fallback: métodos específicos async
  const paintStyles = await figma.getLocalPaintStylesAsync();
  const textStyles = await figma.getLocalTextStylesAsync();
  const effectStyles = await figma.getLocalEffectStylesAsync();
  const gridStyles = await figma.getLocalGridStylesAsync();

  return {
    paint: paintStyles.map((s: any) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description || "",
      remote: !!s.remote,
      paints: (s.paints || []).map(paintToJson),
    })),
    text: textStyles.map((s: any) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description || "",
      remote: !!s.remote,
      fontName: s.fontName,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      paragraphSpacing: s.paragraphSpacing,
      textCase: s.textCase,
      textDecoration: s.textDecoration,
    })),
    effect: effectStyles.map((s: any) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description || "",
      remote: !!s.remote,
      effects: s.effects || [],
    })),
    grid: gridStyles.map((s: any) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description || "",
      remote: !!s.remote,
      layoutGrids: s.layoutGrids || [],
    })),
  };
}

async function exportUsedStyles(scan: "page" | "document") {
  if (scan === "document") {
    // obrigatório quando documentAccess = dynamic-page
    await figma.loadAllPagesAsync();
  }

  const used: Record<string, { fields: string[]; sampleNodeId?: string; computed?: any }> = {};

  function add(styleId: any, field: string, node: any) {
    if (!styleId || styleId === figma.mixed) return;
    const sid = String(styleId);
    if (!used[sid]) used[sid] = { fields: [] };
    if (used[sid].fields.indexOf(field) < 0) used[sid].fields.push(field);

    if (!used[sid].sampleNodeId && node && node.id) {
      used[sid].sampleNodeId = node.id;
      used[sid].computed = computeStyleFromNode(field, node);
    }
  }

  const nodes = scan === "page" ? figma.currentPage.findAll() : figma.root.findAll();

  for (let i = 0; i < nodes.length; i++) {
    const n: any = nodes[i];
    if ("fillStyleId" in n) add(n.fillStyleId, "fill", n);
    if ("strokeStyleId" in n) add(n.strokeStyleId, "stroke", n);
    if ("backgroundStyleId" in n) add(n.backgroundStyleId, "background", n);
    if ("effectStyleId" in n) add(n.effectStyleId, "effect", n);
    if ("gridStyleId" in n) add(n.gridStyleId, "grid", n);
    if ("textStyleId" in n) add(n.textStyleId, "text", n);
  }

  const resolved: any[] = [];
  const unresolved: any[] = [];

  for (const styleId in used) {
    if (!Object.prototype.hasOwnProperty.call(used, styleId)) continue;

    let st: any = null;
    try {
      st = await figma.getStyleByIdAsync(styleId);
    } catch {
      st = null;
    }

    if (st) {
      resolved.push(serializeStyleObject(st, used[styleId]));
    } else {
      unresolved.push({
        id: styleId,
        consumers: used[styleId],
        computed: used[styleId].computed || null,
        note:
          "Style não resolvido via API (provavelmente library não importada). Exportado computed do node de amostra.",
      });
    }
  }

  resolved.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  unresolved.sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));

  return {
    scan,
    resolvedCount: resolved.length,
    unresolvedCount: unresolved.length,
    resolved,
    unresolved,
  };
}

async function exportLibraryStylesIndex() {
  try {
    const tl: any = (figma as any).teamLibrary;
    if (!tl || typeof tl.getAvailableLibrariesAsync !== "function") {
      return {
        available: false,
        libraries: [],
        note: "teamLibrary não disponível neste runtime/arquivo.",
      };
    }

    const libraries = await tl.getAvailableLibrariesAsync();
    const out: any[] = [];

    for (let i = 0; i < libraries.length; i++) {
      const lib = libraries[i];

      let styles: any[] = [];
      try {
        styles = await tl.getAvailableLibraryStylesAsync(lib.id);
      } catch {
        styles = [];
      }

      out.push({
        id: lib.id,
        name: lib.name,
        enabled: lib.enabled,
        styles: styles.map((s: any) => ({
          key: s.key,
          name: s.name,
          styleType: s.styleType,
        })),
      });
    }

    out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return { available: true, libraries: out };
  } catch (e: any) {
    // cobre: permissão "teamlibrary" ausente no manifest, etc.
    return {
      available: false,
      libraries: [],
      note: e && e.message ? e.message : String(e),
    };
  }
}

export async function exportCollectionsAndStylesJson(options?: { scan?: "page" | "document" }) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  const localStyles = await exportLocalStylesJson();
  const usedStyles = await exportUsedStyles(options && options.scan ? options.scan : "document");
  const libraryIndex = await exportLibraryStylesIndex();

  return {
    exportedAt: new Date().toISOString(),
    file: { name: figma.root.name },
    collections: collections.map((c: any) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m: any) => ({ modeId: m.modeId, name: m.name })),
    })),
    styles: {
      local: localStyles,
      used: usedStyles,
      libraryIndex,
      note:
        "libraryIndex é catálogo (metadata). Valores reais vêm de local e/ou used (resolved/computed).",
    },
  };
}
