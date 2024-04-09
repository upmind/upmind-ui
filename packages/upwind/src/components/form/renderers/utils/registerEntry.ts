import type { JsonFormsRendererRegistryEntry, Tester } from "@jsonforms/core";
import { rankWith } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export function registerEntry(
  renderer: any,
  { rank, controlType }: { rank: number; controlType: Tester }
) {
  const entry: JsonFormsRendererRegistryEntry = {
    renderer,
    tester: rankWith(rank, controlType),
  };
  return entry;
}
