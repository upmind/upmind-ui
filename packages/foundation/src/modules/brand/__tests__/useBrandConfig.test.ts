/**
 * @fileoverview useBrandConfig resolve + brand-keyed cache — ADR 023 §10 Axis 1
 *
 * ## Job To Be Done
 * Prove the brand-invariant half of the state model. Brand config is identical
 * for every user of a brand, so §10 Axis 1 resolves it from the settings bundle
 * the BE returns WITH ITS ID and caches it under that id. This spec drives the
 * id from unresolved to resolved, reads the cache keys back, and exercises both
 * arms of invalidation.
 *
 * ## What Breaks If These Fail
 * Reading config before the id resolves hands callers a half-brand — the wrong
 * theme and the wrong name paint on first render. Caching under anything but the
 * bundle id is the §10 leak: an SSR process serves one brand's settings to
 * another brand's visitor, or grows a key per client and leaks memory.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetHeadlessStub, setBrand } from "../../../__tests__/headless.stub";
import { useBrandConfig } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
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
    useBrandConfig().invalidate();
  });

  it("resolves nothing while the settings bundle has no id", () => {
    const { config, meta } = useBrandConfig();

    expect(config.value).toBeUndefined();
    expect(meta.value.isResolved).toBe(false);
  });

  it("caches the resolved bundle under the bundle's own id", async () => {
    const config = await resolveBrand("brand-eu");
    const { cachedIds, meta } = useBrandConfig();

    expect(config?.id).toBe("brand-eu");
    expect(cachedIds()).toEqual(["brand-eu"]);
    expect(meta.value).toEqual({ isAvailable: true, isResolved: true });
  });

  it("surfaces the brand's configured theme on the config", async () => {
    const config = await resolveBrand("brand-eu", { themeId: "midnight" });

    expect(config?.themeId).toBe("midnight");
  });

  it("keeps one cache entry per brand id, not per read", async () => {
    await resolveBrand("brand-eu");
    const config = await resolveBrand("brand-us");
    const { cachedIds } = useBrandConfig();

    expect(config?.id).toBe("brand-us");
    expect([...cachedIds()].sort()).toEqual(["brand-eu", "brand-us"]);
  });

  it("drops only the named brand on invalidate(id)", async () => {
    await resolveBrand("brand-eu");
    await resolveBrand("brand-us");
    const { cachedIds, invalidate } = useBrandConfig();

    invalidate("brand-eu");

    expect(cachedIds()).toEqual(["brand-us"]);
  });

  it("drops every brand on invalidate()", async () => {
    await resolveBrand("brand-eu");
    await resolveBrand("brand-us");
    const { cachedIds, invalidate } = useBrandConfig();

    invalidate();

    expect(cachedIds()).toEqual([]);
  });
});
