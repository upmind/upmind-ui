import { themes } from "@upmind/tokens";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readRoot,
  resetDocument,
  settle,
  stubMatchMedia
} from "./support/theme-harness";
import { APP_BRANDS } from "~/portal/brands";
import { PORTAL_CONFIGS, PORTAL_CONFIG_ID } from "~/portal/config";

/**
 * tasks.md 6.0 / ui-gaps.md F1a — `PortalConfig.theme` must reach the
 * running app's `data-theme` attribute, per shape, through the real
 * config-switch -> layout -> `useTheme` path (`app/layouts/default.vue`).
 * Asserts the RENDERED consequence on `document.documentElement` — never
 * the config field read back at itself. Paired blind with
 * tests/shape-theme-ignored.must-fail.patch.
 *
 * The app ships ONE shape (config/index.ts, 2026-08-28), and one shape can
 * never show that the attribute FOLLOWS the config rather than being fixed.
 * That half lives in tests/shape-theme-follows-config.test.ts, which re-themes
 * this shape's own config module — a mock a real-config mount in the same file
 * would defeat, because `vi.resetModules()` leaves the earlier mount's module
 * graph alive and it wins the `data-theme` write.
 */

/** Read off the tokens package, never restated here — a brand that changes its own mind must move this suite with it. */
const prefersDark = (theme: string) =>
  [...themes, ...APP_BRANDS].find(candidate => candidate.name === theme)
    ?.preferredMode === "dark";

function stubRoute(configId?: string) {
  Object.assign(globalThis, {
    useRoute: () => ({
      path: "/",
      query: configId ? { config: configId } : {}
    }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      afterEach: vi.fn()
    })
  });
}

/** Every mounted tree, so a test can unmount before its `useRoute` stub goes. */
const mounted: ReturnType<typeof mount>[] = [];

async function mountLayout(configId?: string) {
  resetDocument();
  stubMatchMedia();
  stubRoute(configId);
  vi.resetModules();
  const { default: DefaultLayout } = await import("~/layouts/default.vue");
  const wrapper = mount(DefaultLayout);
  mounted.push(wrapper);
  await settle();
  return wrapper;
}

/**
 * The `settings` module loads its dialog asynchronously (a static import would
 * close a registry -> config -> registry ring), so the tree is still resolving
 * after the assertions. Deleting the `useRoute` stub while a component is
 * mid-setup raised unhandled errors that vitest reported ALONGSIDE a green
 * run — the stub has to outlive the components that read it.
 */
function unmountAll() {
  while (mounted.length) mounted.pop()?.unmount();
}

describe("app/layouts/default.vue — a shape's own theme reaches <html data-theme>", () => {
  afterEach(() => {
    unmountAll();
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "useRouter");
    resetDocument();
  });

  it(`applies its own brand AND mode — for the hostgrid shape`, async () => {
    await mountLayout(PORTAL_CONFIG_ID.HOSTGRID);

    // The shape's own theme, read off the config: a shape names the brand it
    // wears, and that name need not be the shape's own.
    const brand = PORTAL_CONFIGS[PORTAL_CONFIG_ID.HOSTGRID].theme;

    // Asserting the brand NAME alone stayed green for a whole epic while
    // every dark-first shape rendered light, so the mode is asserted here
    // beside it (useTheme's brand-switch boundary is what carries it).
    expect(readRoot()).toEqual({
      theme: brand,
      isDarkClass: prefersDark(brand ?? "")
    });
  });
});
