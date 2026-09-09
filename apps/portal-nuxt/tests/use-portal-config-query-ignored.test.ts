import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PORTAL_CONFIG_ID } from "~/portal/config";

/**
 * tasks.md 6.3b — `?config=<id>` wins over localStorage, which wins over the
 * default. Each level is exercised against the level(s) below it so a
 * resolver that just returns one source unconditionally cannot pass every
 * case here. Paired blind with
 * tests/use-portal-config-query-ignored.must-fail.patch.
 *
 * Precedence needs TWO ids to be visible at all, and the app ships one shape
 * (config/index.ts, 2026-08-28) — so those cases run against a stub roster of
 * two, which is also what stops them re-reading the brand roster instead of
 * the resolver. The fallback cases keep the SHIPPED roster: what they grade
 * is the real default.
 */
const STUB_SHAPE = { ALPHA: "alpha", BETA: "beta" } as const;

function stubRoute(query: Record<string, string> = {}) {
  Object.assign(globalThis, { useRoute: () => ({ path: "/", query }) });
}

async function loadUsePortalConfig() {
  vi.resetModules();
  return import("~/composables/usePortalConfig");
}

/** The same loader over a two-shape roster — `alpha` is its default. */
async function loadOverStubRoster() {
  vi.resetModules();
  vi.doMock("~/portal/config", () => ({
    DEFAULT_PORTAL_CONFIG_ID: STUB_SHAPE.ALPHA,
    PORTAL_CONFIGS: {
      [STUB_SHAPE.ALPHA]: { primitives: {}, content: {} },
      [STUB_SHAPE.BETA]: { primitives: {}, content: {} }
    },
    PORTAL_CONFIG_OPTIONS: [
      { id: STUB_SHAPE.ALPHA, label: "Alpha" },
      { id: STUB_SHAPE.BETA, label: "Beta" }
    ],
    isPortalConfigId: (value: unknown) =>
      value === STUB_SHAPE.ALPHA || value === STUB_SHAPE.BETA
  }));
  return import("~/composables/usePortalConfig");
}

describe("usePortalConfig — ?config= wins over localStorage wins over the default", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.doUnmock("~/portal/config");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("with neither a query nor a stored value, the shipped default stands", async () => {
    stubRoute();
    const { usePortalConfig } = await loadUsePortalConfig();

    expect(usePortalConfig().activeConfigId.value).toBe(
      DEFAULT_PORTAL_CONFIG_ID
    );
  });

  it("a stored value wins over the default when there is no query", async () => {
    localStorage.setItem("upmind-portal-config", STUB_SHAPE.BETA);
    stubRoute();
    const { usePortalConfig } = await loadOverStubRoster();

    expect(usePortalConfig().activeConfigId.value).toBe(STUB_SHAPE.BETA);
  });

  it("the query wins over a DIFFERENT stored value — the load-bearing case a query-ignoring resolver fails", async () => {
    localStorage.setItem("upmind-portal-config", STUB_SHAPE.BETA);
    stubRoute({ config: STUB_SHAPE.ALPHA });
    const { usePortalConfig } = await loadOverStubRoster();

    expect(usePortalConfig().activeConfigId.value).toBe(STUB_SHAPE.ALPHA);
  });

  it("an unknown query id falls back to the default rather than throwing, even with a valid stored value present", async () => {
    localStorage.setItem("upmind-portal-config", DEFAULT_PORTAL_CONFIG_ID);
    stubRoute({ config: "not-a-real-config" });
    const { usePortalConfig } = await loadUsePortalConfig();

    let cfg: ReturnType<typeof usePortalConfig> | undefined;
    expect(() => {
      cfg = usePortalConfig();
    }).not.toThrow();
    expect(cfg?.activeConfigId.value).toBe(DEFAULT_PORTAL_CONFIG_ID);
    expect(cfg?.activeConfig.value).toBeDefined();
  });

  it("an unknown query id with no valid stored value falls back to the default", async () => {
    stubRoute({ config: "not-a-real-config" });
    const { usePortalConfig } = await loadUsePortalConfig();
    const cfg = usePortalConfig();

    expect(cfg.activeConfigId.value).toBe(DEFAULT_PORTAL_CONFIG_ID);
    expect(cfg.activeConfig.value).toBeDefined();
  });

  it("an unknown stored value, with no query, falls back to the default rather than standing as the active id", async () => {
    localStorage.setItem("upmind-portal-config", "not-a-real-config");
    stubRoute();
    const { usePortalConfig } = await loadUsePortalConfig();
    const cfg = usePortalConfig();

    expect(cfg.activeConfigId.value).toBe(DEFAULT_PORTAL_CONFIG_ID);
    expect(cfg.activeConfig.value).toBeDefined();
  });
});
