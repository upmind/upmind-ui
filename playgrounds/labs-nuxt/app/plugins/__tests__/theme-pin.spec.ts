/**
 * @module plugins/__tests__/theme-pin.spec
 * @description The theme is PINNED (T1.2). `useTheme` resolves
 * `initial ?? brand.uiTheme.variant ?? "default"`, so a plugin that passes no
 * `initial` hands the playground's colours to whatever variant the staging
 * brand happens to carry — and the ruled token values stop being what is on
 * screen (`G10`, the token ruling, `AC10.2`).
 *
 * The claim is therefore about the ARGUMENT, not the outcome: the boot always
 * supplies the `default` variant explicitly, whatever the brand says.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

// -----------------------------------------------------------------------------

const useTheme = vi.fn(() => ({ isReady: () => Promise.resolve() }));
const decorateRoutes = vi.fn();
const registerOverlayRoutes = vi.fn();

/** A staging brand carrying its OWN variant — the value the pin must beat. */
const client = (variant: string | undefined): Record<string, unknown> => ({
  brand: { uiTheme: { variant } },
  isReady: () => Promise.resolve(),
  install: vi.fn()
});

const init = vi.fn(() => client("christmas"));

/**
 * The client is a namespace object the boot calls members on in sequence; the
 * pin is the only member under test, so every other one answers inertly rather
 * than being enumerated here and re-chased whenever the boot grows a step.
 */
const members = new Map<string, ReturnType<typeof vi.fn>>();
const UpmindClient = new Proxy({} as Record<string, unknown>, {
  get: (_target, name: string) => {
    if (name === "init") return init;
    if (!members.has(name))
      members.set(
        name,
        vi.fn(async () => undefined)
      );
    return members.get(name);
  }
});

vi.mock("@upmind-automation/client-vue", () => ({
  default: UpmindClient,
  decorateRoutes,
  registerOverlayRoutes,
  useTheme
}));

vi.mock("@upmind-automation/upmind-ui", () => ({ plugins: [] }));

vi.mock("~/funnels", () => ({
  LABS_OVERLAYS: [],
  registerFunnels: vi.fn()
}));

const BRAND_VARIANTS = ["christmas", "upmind", "", undefined];

function nuxtApp(): Record<string, unknown> {
  const vueApp = createApp({ render: () => null });
  return {
    vueApp,
    provide: vi.fn(),
    hook: vi.fn(),
    $router: {
      addRoute: vi.fn(),
      getRoutes: () => [],
      options: { routes: [] }
    },
    $i18n: { locale: { value: "en" } }
  };
}

async function bootPlugin(): Promise<void> {
  vi.stubGlobal("defineNuxtPlugin", <T>(plugin: T): T => plugin);
  vi.stubGlobal("useRuntimeConfig", () => ({ public: {} }));
  vi.stubGlobal("useRouter", () => nuxtApp().$router);
  vi.stubGlobal("useNuxtApp", nuxtApp);

  const module = await import("../upmind.client");
  const plugin = module.default as
    | ((app: unknown) => unknown)
    | { setup: (app: unknown) => unknown };

  const run = typeof plugin === "function" ? plugin : plugin.setup;
  await run(nuxtApp());
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("T1.2 theme pin — the playground boots at the ruled token values", () => {
  it("calls useTheme with the default variant, explicitly", async () => {
    await bootPlugin();

    expect(useTheme).toHaveBeenCalled();
    expect(useTheme).toHaveBeenCalledWith("default");
  });

  it("passes an initial variant at all, so the brand's own can never win", async () => {
    await bootPlugin();

    const [initial] = useTheme.mock.calls[0] ?? [];
    expect(initial).toBeDefined();
    expect(initial).not.toBe("");
  });

  it("hands the same variant whatever uiTheme.variant the brand carries", async () => {
    const seen: unknown[] = [];

    for (const variant of BRAND_VARIANTS) {
      init.mockReturnValue(client(variant));
      await bootPlugin();
      seen.push(useTheme.mock.calls[0]?.[0]);
      vi.resetModules();
      vi.clearAllMocks();
    }

    expect(seen).toStrictEqual(["default", "default", "default", "default"]);
  });
});
