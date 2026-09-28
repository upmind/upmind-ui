// -----------------------------------------------------------------------------
/**
 * @fileoverview app/layouts/auth.vue — the portal theme at startup
 *
 * ## Job To Be Done
 * The auth layout applies the active config's theme when it mounts, re-applies
 * it on every config change, and applies "upmind" when the config names none.
 *
 * ## What Breaks If These Fail
 * A direct load of /login, /register or /forgotten-password sets no
 * `data-theme`, so the sign-in screens never load the portal's brand CSS.
 */

import { assign, omit } from "lodash-es";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, shallowRef } from "vue";
import { resetDocument, stubMatchMedia } from "./support/theme-harness";
import type { Mock } from "vitest";
import type { ShallowRef } from "vue";
import { PORTAL_CONFIG_ID, PORTAL_CONFIGS } from "~/portal/config";
import type { PortalConfig } from "~/portal/types";

// -----------------------------------------------------------------------------

const THEME = {
  AURORA: "aurora",
  VERDANT: "verdant",
  FALLBACK: "upmind"
} as const;

const SHIPPED = PORTAL_CONFIGS[PORTAL_CONFIG_ID.HOSTGRID];

const UNTHEMED: PortalConfig = omit(SHIPPED, "theme");

const themed = (theme: string): PortalConfig =>
  assign(omit(SHIPPED, "theme"), { theme });

type Harness = {
  activeConfig: ShallowRef<PortalConfig>;
  setTheme: Mock<(name: string) => void>;
};

let wrapper: VueWrapper | undefined;

async function mountAuthLayout(initial: PortalConfig): Promise<Harness> {
  const activeConfig = shallowRef(initial);
  const setTheme = vi.fn<(name: string) => void>();

  vi.doMock("~/composables/usePortalConfig", async importOriginal => {
    const actual =
      await importOriginal<typeof import("~/composables/usePortalConfig")>();
    return {
      ...actual,
      usePortalConfig: (...args: Parameters<typeof actual.usePortalConfig>) =>
        assign(actual.usePortalConfig(...args), { activeConfig })
    };
  });
  vi.doMock("~/composables/useTheme", async importOriginal => {
    const actual =
      await importOriginal<typeof import("~/composables/useTheme")>();
    return {
      ...actual,
      useTheme: () => assign(actual.useTheme(), { setTheme })
    };
  });

  const { default: AuthLayout } = await import("~/layouts/auth.vue");
  wrapper = mount(AuthLayout);

  return { activeConfig, setTheme };
}

// -----------------------------------------------------------------------------

describe("app/layouts/auth.vue — the portal theme at startup", () => {
  beforeEach(() => {
    vi.resetModules();
    resetDocument();
    stubMatchMedia();
    Object.assign(globalThis, {
      useRoute: () => ({
        path: "/login",
        query: { config: PORTAL_CONFIG_ID.HOSTGRID }
      }),
      useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        afterEach: vi.fn()
      })
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.doUnmock("~/composables/usePortalConfig");
    vi.doUnmock("~/composables/useTheme");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "useRouter");
    resetDocument();
  });

  it("applies the active config's theme when it mounts", async () => {
    const { setTheme } = await mountAuthLayout(themed(THEME.AURORA));

    expect(setTheme.mock.calls).toEqual([[THEME.AURORA]]);
  });

  it("applies the new theme when the active config changes", async () => {
    const { activeConfig, setTheme } = await mountAuthLayout(
      themed(THEME.AURORA)
    );

    activeConfig.value = themed(THEME.VERDANT);
    await nextTick();

    expect(setTheme.mock.calls).toEqual([[THEME.AURORA], [THEME.VERDANT]]);
  });

  it("applies the upmind fallback when it mounts under a config with no theme", async () => {
    const { setTheme } = await mountAuthLayout(UNTHEMED);

    expect(setTheme.mock.calls).toEqual([[THEME.FALLBACK]]);
  });

  it("applies the upmind fallback when the active config changes to one with no theme", async () => {
    const { activeConfig, setTheme } = await mountAuthLayout(
      themed(THEME.AURORA)
    );

    activeConfig.value = UNTHEMED;
    await nextTick();

    expect(setTheme.mock.calls).toEqual([[THEME.AURORA], [THEME.FALLBACK]]);
  });
});
