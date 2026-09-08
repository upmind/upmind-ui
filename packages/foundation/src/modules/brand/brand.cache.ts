/**
 * @internal
 * The brand-keyed cache of ADR 023 §10 Axis 1. Brand config is brand-invariant,
 * so one process-global map is safe under SSR, and keying by the settings-bundle
 * id keeps it bounded by the brand count — never by a client id, which is not.
 */
import type { BrandConfig } from "./brand.types";

const configs = new Map<string, BrandConfig>();

/**
 * The one chokepoint every brand read goes through, mirroring `headless`'s
 * `ensure(scopeKey, factory)` seam. Resolution is idempotent for a given id.
 */
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

/** Busts one brand's entry, or every entry when no id is named. */
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
