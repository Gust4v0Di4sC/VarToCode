// src/code.ts
/// <reference types="@figma/plugin-typings" />

import { handleUiMessage } from "./controller";

figma.showUI(__html__, { width: 660, height: 600 });

figma.ui.onmessage = async (msg) => {
  await handleUiMessage(msg);
};
