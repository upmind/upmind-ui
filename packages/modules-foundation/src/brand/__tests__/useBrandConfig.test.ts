/**
 * @fileoverview useBrandConfig resolve and brand-keyed cache.
 *
 * ## Job To Be Done
 * Config resolves only once the bundle id does, and is cached under that id.
 *
 * ## What Breaks If These Fail
 * A half-brand paints on first render, or SSR serves one brand's settings to another.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetHeadlessStub, setBrand } from "../../__tests__/headless.stub";
import { useBrandConfig } from "../../index";
import { cachedBrandIds, invalidateBrandConfig } from "../brand.cache";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

async function resolveBrand(id: string, extra = {}) {
  setBrand({ id, name: id, isAvailable: true, ...extra });
  await flush();
  return useBrandConfig().config.value;
}

describe("useBrandConfig", () => {
  beforeEach(() => {
    resetHeadlessStub();
    invalidateBrandConfig();
  });

  it("resolves nothing while the settings bundle has no id", () => {
    const { config, meta } = useBrandConfig();

    expect(config.value).toBeUndefined();
    expect(meta.value.isResolved).toBe(false);
  });

  it("caches the resolved bundle under the bundle's own id", async () => {
    const config = await resolveBrand("brand-eu");
    const { meta } = useBrandConfig();

    expect(config?.id).toBe("brand-eu");
    expect(cachedBrandIds()).toEqual(["brand-eu"]);
    expect(meta.value).toEqual({ isAvailable: true, isResolved: true });
  });

  it("surfaces the brand's configured theme on the config", async () => {
    const config = await resolveBrand("brand-eu", { themeId: "midnight" });

    expect(config?.themeId).toBe("midnight");
  });

  it("keeps one cache entry per brand id, not per read", async () => {
    await resolveBrand("brand-eu");
    const config = await resolveBrand("brand-us");

    expect(config?.id).toBe("brand-us");
    expect([...cachedBrandIds()].sort()).toEqual(["brand-eu", "brand-us"]);
  });
});
