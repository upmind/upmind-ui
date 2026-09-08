import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PORTAL_CONFIG_ID, PORTAL_CONFIG_ID } from "~/portal/config";

/**
 * `NUXT_PUBLIC_PORTAL_CONFIG` — the shape a dev server boots as, so the
 * per-brand `dev:<brand>` scripts run side by side with no `?config=` on any
 * URL.
 *
 * This suite exists because the pin SHIPPED AS A SILENT NO-OP: it read
 * `globalThis.useRuntimeConfig`, which is nothing in the browser, so every
 * server served the default shape while the config, the scripts and the env
 * var all looked correct. Nothing failed; it just quietly did not work. Every
 * case below therefore asserts the RESOLVED id, and the precedence cases pin
 * the pin against each neighbour so a resolver returning one source
 * unconditionally cannot pass them all.
 *
 * Paired blind with tests/server-pinned-shape.must-fail.patch.
 *
 * The pin is only VISIBLE against a shape that is not the default, and the
 * app ships one shape (config/index.ts, 2026-08-28) — so the precedence cases
 * run against a stub roster of two. The fallback cases keep the SHIPPED
 * roster: what they grade is the real default.
 */
const STUB_SHAPE = { ALPHA: "alpha", BETA: "beta" } as const;
function stubRoute(query: Record<string, string> = {}) {
  Object.assign(globalThis, { useRoute: () => ({ path: "/", query }) });
}

function stubRuntimeConfig(portalConfig?: string) {
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({ public: { portalConfig: portalConfig ?? "" } })
  });
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

describe("usePortalConfig — the shape a server was booted as", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.doUnmock("~/portal/config");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "useRuntimeConfig");
  });

  it("boots as the pinned shape, with no query and nothing stored", async () => {
    stubRoute();
    stubRuntimeConfig(STUB_SHAPE.BETA);
    const { usePortalConfig } = await loadOverStubRoster();

    expect(usePortalConfig().activeConfigId.value).toBe(STUB_SHAPE.BETA);
  });

  it("pins each shape independently, so one server's pin is not another's", async () => {
    for (const id of [STUB_SHAPE.ALPHA, STUB_SHAPE.BETA]) {
      stubRoute();
      stubRuntimeConfig(id);
      const { usePortalConfig } = await loadOverStubRoster();
      expect(usePortalConfig().activeConfigId.value).toBe(id);
    }
  });

  it("falls back to the default when no shape is pinned", async () => {
    stubRoute();
    stubRuntimeConfig("");
    const { usePortalConfig } = await loadUsePortalConfig();

    expect(usePortalConfig().activeConfigId.value).toBe(
      DEFAULT_PORTAL_CONFIG_ID
    );
  });

  it("falls back to the default when the pinned id is not a shape", async () => {
    stubRoute();
    stubRuntimeConfig("not-a-shape");
    const { usePortalConfig } = await loadUsePortalConfig();

    expect(usePortalConfig().activeConfigId.value).toBe(
      DEFAULT_PORTAL_CONFIG_ID
    );
  });

  it("an explicit pick outranks the pin, so the switcher still works on a pinned server", async () => {
    // The stored pick is the NON-default shape and the pin is the default:
    // a resolver that ignores storage lands on the default either way, so
    // only the pick actually winning turns this green.
    localStorage.setItem("upmind-portal-config", STUB_SHAPE.BETA);
    stubRoute();
    stubRuntimeConfig(STUB_SHAPE.ALPHA);
    const { usePortalConfig } = await loadOverStubRoster();

    expect(usePortalConfig().activeConfigId.value).toBe(STUB_SHAPE.BETA);
  });

  it("a query wins over the pin", async () => {
    stubRoute({ config: STUB_SHAPE.ALPHA });
    stubRuntimeConfig(STUB_SHAPE.BETA);
    const { usePortalConfig } = await loadOverStubRoster();

    expect(usePortalConfig().activeConfigId.value).toBe(STUB_SHAPE.ALPHA);
  });

  it("storage starts ABSENT, so a pin is reachable at all", async () => {
    stubRoute();
    stubRuntimeConfig(PORTAL_CONFIG_ID.HOSTGRID);
    const { usePortalConfig } = await loadUsePortalConfig();
    usePortalConfig();

    // `useLocalStorage` writes its default on first read. Seeding it with the
    // default shape meant storage always held a valid id and the pin could
    // never be reached — the second half of the original defect.
    expect(localStorage.getItem("upmind-portal-config")).toBeNull();
  });
});

/**
 * The precedence suite above cannot catch the defect that shipped, and saying
 * so is the point of this block.
 *
 * The bug was reading `useRuntimeConfig` off `globalThis` instead of calling
 * the Nuxt AUTO-IMPORT. In jsdom the two are indistinguishable: these tests
 * supply the stub AS a global, so the broken read finds it and every assertion
 * above passes against the broken code. Verified by applying
 * server-pinned-shape.must-fail.patch — seven green.
 *
 * What actually proved it was driving three pinned dev servers and reading
 * back `data-theme` (upmind / vermilion / hostgrid). That is the real oracle
 * and it does not fit in a unit suite, so this asserts the one thing jsdom CAN
 * see: the source calls the auto-import, and never reaches for it on a global.
 */
describe("usePortalConfig — reads the runtime config the way Nuxt provides it", () => {
  it("calls the useRuntimeConfig auto-import, never a global lookup", async () => {
    // `?raw` rather than fs: under vitest `import.meta.url` is the dev
    // server's http URL, not a file path, so fileURLToPath refuses it.
    const raw = (await import("~/composables/usePortalConfig.ts?raw")).default;
    // Comments are stripped first: the file EXPLAINS the globalThis defect in
    // prose, and grading the prose instead of the code is how this assertion
    // first went red against correct source.
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    expect(code).toContain('typeof useRuntimeConfig !== "function"');
    expect(code).toContain("useRuntimeConfig().public");
    // the shipped defect, in every spelling that reaches for it off an object
    expect(code).not.toMatch(/globalThis[\s\S]{0,80}useRuntimeConfig/);
    expect(code).not.toMatch(/\.\s*useRuntimeConfig/);
  });
});
