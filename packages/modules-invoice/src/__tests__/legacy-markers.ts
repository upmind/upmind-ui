/**
 * @fileoverview The legacy order module's moved files and the rule that reads its markers.
 */

// -----------------------------------------------------------------------------

export const LEGACY_COMMIT = "0ae90add2c5f152190580bfb5a37c0b62e4d3ed7";

export const LEGACY_ROOT = "packages/client-vue/src/modules/order";

export const MOVED_FILES = [
  "Order.vue",
  "components/OrderProducts.vue",
  "components/OrderProductsRow.vue",
  "types.ts",
  "utils.ts",
  "variants.ts"
] as const;

// The package keeps no .vue at its src root, so the page organism sits in components/.
export const PACKAGE_FILES: Record<(typeof MOVED_FILES)[number], string> = {
  "Order.vue": "components/Order.vue",
  "components/OrderProducts.vue": "components/OrderProducts.vue",
  "components/OrderProductsRow.vue": "components/OrderProductsRow.vue",
  "types.ts": "types.ts",
  "utils.ts": "utils.ts",
  "variants.ts": "variants.ts"
};

const MARKER_PATTERNS = [
  /\bt\(\s*["']([\w.]+)["']/g,
  /data-test-key="([^"]+)"/g,
  /\bid="([^"]+)"/g,
  /v-(?:if|else-if|show)="([^"]+)"/g
];

export function markersIn(source: string): string[] {
  const found = new Set<string>();

  for (const pattern of MARKER_PATTERNS) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }

  return [...found];
}
