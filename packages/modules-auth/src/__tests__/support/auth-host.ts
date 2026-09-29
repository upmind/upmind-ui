// -----------------------------------------------------------------------------
/**
 * @module __tests__/support/auth-host
 * @description Mounts one auth page the way a host page does: a `templates`
 * record, the three route props, optional slot fills, and `headless` stood in
 * for by the state below. The test file installs the mocks with
 * `vi.mock(..., () => import("./support/auth-host").then(...))`.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import { Suspense, computed, defineComponent, h, reactive, ref } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { AUTH_TEMPLATE } from "../../types";
import {
  assign,
  forEach,
  get,
  includes,
  isString,
  map,
  omit,
  startsWith
} from "lodash-es";
import type { AuthTemplates } from "../../types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component, Slot } from "vue";

// -----------------------------------------------------------------------------

export const START = "/start";

export const TEMPLATE_KEY = "data-template";

export const REGION_KEY = "data-region";

export const REGIONS = [
  "back",
  "hero",
  "markdown",
  "form",
  "summary",
  "actions"
] as const;

export const ROUTES = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "recover" }
};

export const CREDENTIALS = {
  username: "jane@example.com",
  password: "s3cret-pass"
};

type HostState = {
  hasFunnels: boolean;
  brandTemplate: string;
  basketSummaryVisible: boolean;
  isRegisteringAsGuest: boolean;
};

const HOST_DEFAULTS: HostState = {
  hasFunnels: true,
  brandTemplate: "",
  basketSummaryVisible: false,
  isRegisteringAsGuest: false
};

/** What the stood-in `headless` answers; reset with `resetHost()`. */
export const host = reactive(assign({}, HOST_DEFAULTS));

export const navigate = vi.fn(() => Promise.resolve());
export const navigateNext = vi.fn(() => Promise.resolve());
export const navigateBack = vi.fn(() => Promise.resolve());
export const resolveMock = vi.fn((_model: unknown) => Promise.resolve(true));
export const registerAsGuestMock = vi.fn(() => Promise.resolve(true));
export const whenAuthenticatedMock = vi.fn(() =>
  Promise.resolve({ id: "client-1" })
);

const mounted: VueWrapper[] = [];

/** Unmounts every page the last test drew and puts the host back to its defaults. */
export function resetHost(): void {
  forEach(mounted, wrapper => wrapper.unmount());
  mounted.length = 0;
  assign(host, HOST_DEFAULTS);
  navigate.mockReset().mockImplementation(() => Promise.resolve());
  navigateNext.mockReset().mockImplementation(() => Promise.resolve());
  navigateBack.mockReset().mockImplementation(() => Promise.resolve());
  resolveMock.mockReset().mockImplementation(() => Promise.resolve(true));
  registerAsGuestMock
    .mockReset()
    .mockImplementation(() => Promise.resolve(true));
  whenAuthenticatedMock
    .mockReset()
    .mockImplementation(() => Promise.resolve({ id: "client-1" }));
}

export const FormStub = defineComponent({
  name: "FormStub",
  emits: ["resolve", "reject", "update:modelValue"],
  setup: () => () => h("div", { "data-form-stub": "" })
});

const TRUE_FLAGS = ["canShowForms", "showLoginForm"];

/** A meta bag: every flag reads false unless the host state says otherwise. */
function metaBag(): Record<string, unknown> {
  return new Proxy(
    {},
    {
      get: (_target, key) => {
        if (!isString(key) || startsWith(key, "__")) return undefined;
        if (key === "isRegisteringAsGuest")
          return computed(() => host.isRegisteringAsGuest);
        return ref(includes(TRUE_FLAGS, key));
      }
    }
  );
}

/** Replaces the `headless` composables the auth pages read. */
export function headlessOverrides(): Record<string, unknown> {
  const authActions = {
    reject: vi.fn(() => Promise.resolve(true)),
    resolve: resolveMock,
    registerAsGuest: registerAsGuestMock,
    set: vi.fn(),
    start: vi.fn(() => Promise.resolve(true))
  };
  return {
    useActiveSession: () => ({
      useActions: () => ({
        isReady: () => Promise.resolve(true),
        whenAuthenticated: whenAuthenticatedMock
      }),
      useContext: () => ({}),
      useInternals: () => ({}),
      useMeta: () => metaBag()
    }),
    useAuth: () => ({
      as: () => ({
        useMeta: () => metaBag(),
        useContext: () => ({
          errors: ref([]),
          model: ref({}),
          schema: ref({}),
          uischema: ref({}),
          validationErrors: ref([])
        }),
        useActions: () => authActions
      })
    }),
    useAccount: () => ({
      as: () => ({
        useMeta: () => metaBag(),
        useContext: () => ({
          errors: ref([]),
          model: ref({}),
          schema: ref({}),
          uischema: ref({}),
          validationErrors: ref([])
        }),
        useActions: () => ({
          cancel: vi.fn(),
          register: vi.fn(() => Promise.resolve(true)),
          resend: vi.fn(),
          set: vi.fn(),
          verify: vi.fn(() => Promise.resolve(true))
        })
      })
    }),
    useBrand: () => ({
      isReady: () => Promise.resolve(true),
      meta: computed(() => ({ isAvailable: true })),
      brandId: computed(() => "brand-1"),
      name: computed(() => "Brand"),
      image: computed(() => null),
      styles: computed(() => null),
      uiTheme: computed(() => ({ tokens: "", variant: undefined })),
      uischema_Route: computed(() => ({})),
      hasUpmindBranding: computed(() => false),
      getConfig: () => ({}),
      getConfigValue: () => undefined
    }),
    useClientTemplate: () => ({
      isReady: () => Promise.resolve(true),
      meta: computed(() => ({ isAvailable: false })),
      data: computed(() => undefined),
      template: computed(() => undefined),
      content: computed(() => undefined)
    }),
    useConfig: () => ({
      data: {},
      ui: {
        theme: computed(() => ""),
        template: computed(() => host.brandTemplate),
        variant: computed(() => undefined),
        iconVariant: computed(() => "outline"),
        basketSummary: {
          get isVisible() {
            return host.basketSummaryVisible;
          }
        },
        guestCheckout: { isVisible: false }
      }
    })
  };
}

/** The routing engine, mocked at its source so every reader sees the same one. */
export function routingEngine() {
  return {
    useRoutingEngine: () => ({
      navigate,
      navigateNext,
      navigateBack,
      meta: computed(() => ({ hasFunnels: host.hasFunnels }))
    })
  };
}

// -----------------------------------------------------------------------------

export type SeenTemplate = {
  name: string;
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
};

export const seen: SeenTemplate[] = [];

/** A template that marks itself and draws every region the pages fill. */
export function recordingTemplate(name: string): Component {
  return defineComponent({
    name: `Template-${name}`,
    inheritAttrs: false,
    props: {
      loginRoute: { type: Object, default: undefined },
      registerRoute: { type: Object, default: undefined },
      recoverRoute: { type: Object, default: undefined },
      template: { type: String, default: undefined }
    },
    setup(props, { attrs, slots }) {
      seen.push({ name, props: assign({}, props), attrs: assign({}, attrs) });
      return () =>
        h(
          "div",
          { [TEMPLATE_KEY]: name },
          map(REGIONS, region => {
            const slot: Slot | undefined = get(slots, region);
            return slot ? h("section", { [REGION_KEY]: region }, slot()) : null;
          })
        );
    }
  });
}

/** One recording template per `AUTH_TEMPLATE` name. */
export function recordingTemplates(): AuthTemplates {
  return {
    [AUTH_TEMPLATE.SPLIT]: recordingTemplate(AUTH_TEMPLATE.SPLIT),
    [AUTH_TEMPLATE.ENCLOSED]: recordingTemplate(AUTH_TEMPLATE.ENCLOSED),
    [AUTH_TEMPLATE.CANVAS_CARD]: recordingTemplate(AUTH_TEMPLATE.CANVAS_CARD),
    [AUTH_TEMPLATE.SURFACE_BOX]: recordingTemplate(AUTH_TEMPLATE.SURFACE_BOX),
    [AUTH_TEMPLATE.TWO_COLUMN_LTR]: recordingTemplate(
      AUTH_TEMPLATE.TWO_COLUMN_LTR
    ),
    [AUTH_TEMPLATE.TWO_COLUMN_RTL]: recordingTemplate(
      AUTH_TEMPLATE.TWO_COLUMN_RTL
    ),
    [AUTH_TEMPLATE.INSET]: recordingTemplate(AUTH_TEMPLATE.INSET)
  };
}

/** The same record with one name left out. */
export function recordWithout(name: AUTH_TEMPLATE): Partial<AuthTemplates> {
  return omit(recordingTemplates(), name);
}

// -----------------------------------------------------------------------------

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false
});

const Blank = { setup: () => () => h("div") };

export type Rendered = {
  wrapper: VueWrapper;
  page: VueWrapper;
  router: ReturnType<typeof createRouter>;
  errors: unknown[];
};

export async function renderPage(
  view: Component,
  options: {
    templates?: Partial<AuthTemplates>;
    slots?: Record<string, Slot>;
    props?: Record<string, unknown>;
  } = {}
): Promise<Rendered> {
  seen.length = 0;
  const errors: unknown[] = [];
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: START, name: "start", component: Blank },
      { path: "/login", name: "login", component: Blank },
      { path: "/register", name: "register", component: Blank },
      { path: "/recover", name: "recover", component: Blank }
    ]
  });
  await router.push(START);
  await router.isReady();

  const templates = options.templates ?? recordingTemplates();
  const Host = defineComponent({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () =>
            h(
              view,
              assign({}, ROUTES, { templates }, options.props),
              options.slots
            ),
          fallback: () => h("div", { "data-suspended": "" })
        });
    }
  });

  const wrapper = mount(Host, {
    global: {
      plugins: [router, i18n],
      config: {
        errorHandler: error => {
          errors.push(error);
        },
        warnHandler: () => undefined
      }
    }
  });
  mounted.push(wrapper);
  await flushPromises();
  await flushPromises();
  return { wrapper, page: wrapper.findComponent(view), router, errors };
}

/** Submits the page's sign-in form the way the engine does. */
export async function submit(rendered: Rendered, model: unknown = CREDENTIALS) {
  rendered.wrapper.findComponent(FormStub).vm.$emit("resolve", model);
  await flushPromises();
  await flushPromises();
}

export function templateDrawn(rendered: Rendered): string | undefined {
  const drawn = rendered.wrapper.find(`[${TEMPLATE_KEY}]`);
  if (!drawn.exists()) return undefined;
  return drawn.attributes(TEMPLATE_KEY);
}

export function region(rendered: Rendered, name: (typeof REGIONS)[number]) {
  return rendered.wrapper.find(`[${REGION_KEY}="${name}"]`);
}
