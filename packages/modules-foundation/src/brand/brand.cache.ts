/**
 * @internal
 * Brand config is brand-invariant, so one process-global map is SSR-safe.
 */
import { shallowReactive } from "vue";
import type { BrandConfig } from "./brand.types";

const configs = shallowReactive(new Map<string, BrandConfig>());

export function ensureBrandConfig(
  id: string,
  factory: () => BrandConfig
): BrandConfig {
  const cached = configs.get(id);

  if (cached) return cached;

  const resolved = factory();
  configs.set(id, resolved);

  return resolved;
}

export function invalidateBrandConfig(id?: string): void {
  if (id === undefined) {
    configs.clear();
    return;
  }

  configs.delete(id);
}

export function cachedBrandIds(): string[] {
  return [...configs.keys()];
}
