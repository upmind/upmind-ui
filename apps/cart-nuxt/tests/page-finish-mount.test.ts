// -----------------------------------------------------------------------------
/**
 * @fileoverview The Nuxt cart reports each finished page to the routing engine.
 *
 * ## Job To Be Done
 * When a page finishes rendering, the routing engine hears that the route the
 * visitor is now on has mounted.
 *
 * ## What Breaks If These Fail
 * Every automatic move waits for a mount that never comes: the button keeps
 * spinning and the order flow stops after its first step.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";

const engine = vi.hoisted(() => ({ mount: vi.fn() }));

vi.mock("@upmind-automation/client", () => ({}));
vi.mock("@upmind-automation/domain", () => ({}));
vi.mock("@upmind-automation/payment", () => ({}));
vi.mock("@upmind-automation/product", () => ({}));

vi.mock("@upmind-automation/foundation", () => ({
  foundationRenderers: [],
  registerFormRenderers: () => undefined,
  useLayout: () => undefined,
  SHELL: { HEADER: "header", FOOTER: "footer", LAYOUT: "layout" },
  useShell: () => ({ reset: () => undefined, has: () => true })
}));

vi.mock("@upmind-automation/headless", () => ({
  decorateRoutes: () => undefined,
  registerOverlayRoutes: () => undefined,
  useRoutingEngine: () => engine
}));

vi.mock("../app/funnels", () => ({ registerFunnels: () => undefined }));
vi.mock("../app/router.options", () => ({ CART_OVERLAYS: {} }));
vi.mock("../app/shell/components/footer/useFooter", () => ({
  useFooter: () => undefined
}));
vi.mock("../app/shell/components/header/useHeader", () => ({
  useHeader: () => undefined
}));
vi.mock("../app/shell/modules/theming/useTheme", () => ({
  useTheme: () => ({ isReady: () => Promise.resolve() })
}));
vi.mock("../app/shell/useUpmindClient", () => ({
  default: {
    init: () => undefined,
    plugins: [],
    isReady: () => Promise.resolve()
  }
}));

// -----------------------------------------------------------------------------

const Page = defineComponent({ render: () => null });

type Hook = () => void;

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: "catalogue", path: "/order/shop/", component: Page },
      { name: "basket", path: "/order/basket/", component: Page }
    ]
  });
}

async function startPlugin(router: Router) {
  const hooks: Record<string, Hook> = {};
  const nuxtApp = {
    $router: router,
    $i18n: {},
    vueApp: { use: () => undefined },
    hook: (name: string, run: Hook) => {
      hooks[name] = run;
    }
  };

  const { default: plugin } = await import("../app/plugins/upmind.client");
  await plugin(nuxtApp);

  return (name: string) => {
    if (!hooks[name]) throw new Error(`the plugin registered no ${name} hook`);
    hooks[name]();
  };
}

beforeEach(() => {
  engine.mount.mockReset();
  vi.stubGlobal("useRuntimeConfig", () => ({ public: { THEME: "default" } }));
});

// -----------------------------------------------------------------------------

describe("a page finishing in the Nuxt cart", () => {
  it("reports the route the visitor is on as mounted", async () => {
    const router = buildRouter();
    await router.push("/order/shop/");
    const fire = await startPlugin(router);

    await router.push("/order/basket/");
    fire("page:finish");

    expect(engine.mount).toHaveBeenCalledTimes(1);
    expect(engine.mount).toHaveBeenCalledWith("basket");
  });

  it("reports each later page by its own name", async () => {
    const router = buildRouter();
    await router.push("/order/basket/");
    const fire = await startPlugin(router);

    fire("page:finish");
    await router.push("/order/shop/");
    fire("page:finish");

    expect(engine.mount.mock.calls).toEqual([["basket"], ["catalogue"]]);
  });
});
