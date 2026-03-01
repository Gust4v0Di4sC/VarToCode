// src/controller.ts
import { exportTailwindV41Css } from "./exporters/tailwind";
import { exportRawJson } from "./exporters/raw";
import { exportCollectionsAndStylesJson } from "./exporters/styles";

function postResult(payload: {
  kind: string;
  filename: string;
  mime: string;
  content: string;
}) {
  figma.ui.postMessage({ type: "EXPORT_RESULT", payload });
}

/**
 * Erro com contexto + dicas comuns
 */
function postError(err: any, ctx?: { action?: string }) {
  const base = err && err.message ? err.message : String(err);
  const action = ctx && ctx.action ? String(ctx.action) : "UNKNOWN";

  let hint = "";

  // Erro clássico em documentAccess: dynamic-page (varrer root.findAll sem loadAllPagesAsync)
  if (
    base.indexOf("documentAccess: dynamic-page") !== -1 ||
    base.indexOf("loadAllPagesAsync") !== -1
  ) {
    hint =
      ' Dica: em documentAccess="dynamic-page", use figma.loadAllPagesAsync() antes de varrer figma.root.findAll().';
  }

  // Team library permissions
  if (base.indexOf("teamlibrary") !== -1 && base.indexOf("manifest") !== -1) {
    hint =
      ' Dica: para teamLibrary, adicione a permissão "teamlibrary" no manifest (se aplicável).';
  }

  figma.ui.postMessage({
    type: "EXPORT_ERROR",
    message: `(${action}) ${base}${hint}`,
  });
}

/**
 * Suporta msg.scan = "page" | "document" para export de styles
 */
export async function handleUiMessage(msg: any) {
  // ✅ captura o "contexto" da ação logo no início
  const action = msg && msg.type ? String(msg.type) : "UNKNOWN";

  try {
    if (!msg || !msg.type) return;

    if (msg.type === "EXPORT_TW_V41") {
      const css = await exportTailwindV41Css();
      postResult({
        kind: "css",
        filename: "figma.tokens.css",
        mime: "text/css",
        content: css,
      });
      return;
    }

    if (msg.type === "EXPORT_RAW_JSON") {
      const json = await exportRawJson();
      postResult({
        kind: "json",
        filename: "figma.variables.raw.json",
        mime: "application/json",
        content: JSON.stringify(json, null, 2),
      });
      return;
    }

    if (msg.type === "EXPORT_COLLECTIONS_STYLES_JSON") {
      const scan = msg.scan === "page" ? "page" : "document";
      const json = await exportCollectionsAndStylesJson({ scan });
      postResult({
        kind: "json",
        filename: "figma.collections+styles.json",
        mime: "application/json",
        content: JSON.stringify(json, null, 2),
      });
      return;
    }

    if (msg.type === "CLOSE") {
      figma.closePlugin();
      return;
    }
  } catch (err: any) {
    // ✅ agora o erro chega com o tipo da ação + dica
    postError(err, { action });
  }
}