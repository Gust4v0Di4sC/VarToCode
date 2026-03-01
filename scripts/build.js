// scripts/build.js
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");
const root = process.cwd();

const SRC_DIR = path.join(root, "src");
const UI_PATH = path.join(root, "ui.html");            
const ENTRY = path.join(SRC_DIR, "code.ts");           
const OUTFILE = path.join(root, "dist", "code.js");

function readUi() {
  return fs.readFileSync(UI_PATH, "utf8");
}

async function run() {
  const ctx = await esbuild.context({
    entryPoints: [ENTRY],
    bundle: true,
    outfile: OUTFILE,
    platform: "browser",
    target: ["es2017"],
    format: "iife",
    sourcemap: true,
    logLevel: "info",
    define: {
      __UI_HTML__: JSON.stringify(readUi()),
    },
  });

  const rebuild = async (reason) => {
    try {
      if (reason) console.log(`[build] ${reason} -> rebuild`);
      await ctx.rebuild();
    } catch (e) {
      console.error("[build] rebuild failed:", e);
    }
  };

  if (watch) {
    await ctx.watch();
    console.log("[build] watching...");

    // ✅ Rebuild quando ui.html mudar
    fs.watchFile(UI_PATH, { interval: 300 }, () => rebuild("ui.html changed"));

    // (Opcional) rebuild se manifest mudar (não afeta bundle, mas ajuda no fluxo)
    const manifestPath = path.join(root, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      fs.watchFile(manifestPath, { interval: 500 }, () =>
        console.log("[build] manifest.json changed (no rebuild needed)")
      );
    }
  } else {
    await rebuild();
    await ctx.dispose();
    console.log("[build] done.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
