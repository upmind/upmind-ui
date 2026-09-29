// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth app's page theme
 *
 * ## Job To Be Done
 * The app wears the brand's theme from startup, and nothing until a brand id exists.
 *
 * ## What Breaks If These Fail
 * The sign-in screens paint the default theme, or a brand refresh leaves the stale theme on screen.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import type { App as VueApp } from "vue";

// -----------------------------------------------------------------------------

const brandId = ref<string | undefined>(undefined);
const theme = ref("default");

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useBrand: () => ({ brandId }),
    useConfig: () => ({ ui: { theme } })
  };
});

const BRAND_ID = "brand-eu";
const THEME = {
  DEFAULT: "default",
  MIDNIGHT: "midnight",
  DAWN: "dawn"
} as const;

const Blank = { setup: () => () => h("div") };

let app: VueApp | undefined;

function pageTheme() {
  return document.documentElement.getAttribute("data-theme");
}

async function mountApp() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: Blank }]
  });

  router.push("/");
  app = createApp(App).use(router);
  app.mount(document.createElement("div"));
  await router.isReady();
  await nextTick();
}

beforeEach(() => {
  brandId.value = undefined;
  theme.value = THEME.DEFAULT;
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.documentElement.removeAttribute("data-theme");
});

describe("App — page theme", () => {
  it("sets no theme while no brand id exists, even with the default theme to hand", async () => {
    await mountApp();

    expect(pageTheme()).toBeNull();
  });

  it("sets the brand's theme at startup once a brand id exists", async () => {
    brandId.value = BRAND_ID;
    theme.value = THEME.MIDNIGHT;

    await mountApp();

    expect(pageTheme()).toBe(THEME.MIDNIGHT);
  });

  it("sets the brand's theme when the brand arrives after startup", async () => {
    theme.value = THEME.MIDNIGHT;
    await mountApp();
    expect(pageTheme()).toBeNull();

    brandId.value = BRAND_ID;
    await nextTick();

    expect(pageTheme()).toBe(THEME.MIDNIGHT);
  });

  it("follows a theme change under the same brand id", async () => {
    brandId.value = BRAND_ID;
    theme.value = THEME.MIDNIGHT;
    await mountApp();
    expect(pageTheme()).toBe(THEME.MIDNIGHT);

    theme.value = THEME.DAWN;
    await nextTick();

    expect(pageTheme()).toBe(THEME.DAWN);
  });
});
