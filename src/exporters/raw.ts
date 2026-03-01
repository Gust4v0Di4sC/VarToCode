// src/exporters/raw.ts
import { serializeValuesByModeAsJson } from "../shared/serialize";

export async function exportRawJson() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();

  return {
    exportedAt: new Date().toISOString(),
    file: { name: figma.root.name },
    collections: collections.map((c: any) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m: any) => ({ modeId: m.modeId, name: m.name })),
    })),
    variables: variables.map((v: any) => ({
      id: v.id,
      key: v.key,
      name: v.name,
      description: v.description || "",
      resolvedType: String(v.resolvedType),
      collectionId: v.variableCollectionId,
      valuesByMode: serializeValuesByModeAsJson(v.valuesByMode),
    })),
  };
}
