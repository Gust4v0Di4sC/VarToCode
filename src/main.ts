declare const __UI_HTML__: string;

import { exportTailwindV41Css } from "./exporters/tailwind";
import { exportRawJson } from "./exporters/raw";
import { exportCollectionsAndStylesJson } from "./exporters/styles";

const W = 660;
const H = 680;

figma.showUI(__UI_HTML__, { width: W, height: H, themeColors: true });

// ✅ força aplicar o tamanho mesmo se o Figma tentar manter tamanho anterior
figma.ui.resize(W, H);

figma.ui.onmessage = async (msg) => {
  try {
    if (!msg || !msg.type) return;

    if (msg.type === "EXPORT_TW_V41") {
      const css = await exportTailwindV41Css();
      figma.ui.postMessage({
        type: "EXPORT_RESULT",
        payload: { kind: "css", filename: "figma.tokens.css", mime: "text/css", content: css },
      });
      return;
    }

    if (msg.type === "EXPORT_RAW_JSON") {
      const json = await exportRawJson();
      const content = JSON.stringify(json, null, 2);
      figma.ui.postMessage({
        type: "EXPORT_RESULT",
        payload: { kind: "json", filename: "figma.variables.raw.json", mime: "application/json", content },
      });
      return;
    }

    if (msg.type === "EXPORT_COLLECTIONS_STYLES_JSON") {
      const scan = msg.scan === "page" ? "page" : "document";
      const json = await exportCollectionsAndStylesJson({ scan });
      const content = JSON.stringify(json, null, 2);
      figma.ui.postMessage({
        type: "EXPORT_RESULT",
        payload: { kind: "json", filename: "figma.collections+styles.json", mime: "application/json", content },
      });
      return;
    }

    if (msg.type === "CLOSE") figma.closePlugin();
  } catch (err: any) {
    figma.ui.postMessage({
      type: "EXPORT_ERROR",
      message: err?.message ? err.message : String(err),
    });
  }
};