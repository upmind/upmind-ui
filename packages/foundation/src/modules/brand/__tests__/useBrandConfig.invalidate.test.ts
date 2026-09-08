/**
 * @fileoverview Brand cache busting is observable to its readers — ADR 023 §10 Axis 1
 *
 * ## Job To Be Done
 * `invalidate` is the only door a caller has when a settings bundle changes
 * under its own id. It is a door only if the next read of a `config` computed
 * that OUTLIVES the call re-resolves against current state. Every spec here
 * holds one computed for the whole case, warms the cache, busts it, and reads
 * again — through the named arm and the bare arm, and across two handles.
 *
 * ## What Breaks If These Fail
 * A bust that empties the map but leaves every reader memoised is a silent
 * no-op: an app that re-fetches its brand settings keeps painting the old name,
 * the old theme and the old favicon until a full page reload. Reading
 * `cachedIds()` back cannot see this — the map really is empty; it is the
 * readers that never look again.
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

async function serveBrand(id: string, name: string) {
  setBrand({ id, name, isAvailable: true });
  await flush();
}

describe("useBrandConfig invalidate", () => {
  beforeEach(() => {
    resetHeadlessStub();
    useBrandConfig().invalidate();
  });

  it("re-resolves a held config once the brand's own id is busted", async () => {
    const { config, invalidate } = useBrandConfig();

    await serveBrand("brand-eu", "EU One");
    expect(config.value?.name).toBe("EU One");

    await serveBrand("brand-us", "US One");
    expect(config.value?.name).toBe("US One");

    await serveBrand("brand-eu", "EU Two");
    expect(config.value?.name).toBe("EU One");

    invalidate("brand-us");
    expect(config.value?.name).toBe("EU One");

    invalidate("brand-eu");
    expect(config.value?.name).toBe("EU Two");
  });

  it("re-resolves every id after a bare invalidate", async () => {
    const { config, cachedIds, invalidate } = useBrandConfig();

    await serveBrand("brand-eu", "EU One");
    expect(config.value?.name).toBe("EU One");

    await serveBrand("brand-us", "US One");
    expect(config.value?.name).toBe("US One");

    await serveBrand("brand-eu", "EU Two");
    expect(config.value?.name).toBe("EU One");
    expect([...cachedIds()].sort()).toEqual(["brand-eu", "brand-us"]);

    invalidate();

    expect(config.value?.name).toBe("EU Two");
    expect(cachedIds()).toEqual(["brand-eu"]);

    await serveBrand("brand-us", "US Two");
    expect(config.value?.name).toBe("US Two");
  });

  it("re-resolves a held config when a separate handle busts the cache", async () => {
    const reader = useBrandConfig();

    await serveBrand("brand-eu", "EU One");
    expect(reader.config.value?.name).toBe("EU One");

    await serveBrand("brand-eu", "EU Two");
    expect(reader.config.value?.name).toBe("EU One");

    useBrandConfig().invalidate("brand-eu");

    expect(reader.config.value?.name).toBe("EU Two");
  });

  it("re-resolves the brand's theme id, not just its name", async () => {
    const { config, invalidate } = useBrandConfig();

    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "aurora"
    });
    await flush();
    expect(config.value?.themeId).toBe("aurora");

    setBrand({ themeId: "midnight" });
    await flush();
    expect(config.value?.themeId).toBe("aurora");

    invalidate("brand-eu");

    expect(config.value?.themeId).toBe("midnight");
  });
});
