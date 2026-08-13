// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC7.1 @AC7.2 @AC7.3 @AC7.4 the auth overlay carries the WHOLE
 * journey plus its scope chooser (H5 sharpened · H9 · C4 · D2 · G12).
 *
 * ## Job To Be Done
 * Two different asks arrive at the same overlay. "Log in to proceed" already
 * knows which session it wants — the link the visitor followed named the scope —
 * so it opens on the login itself. "Add a session" does not know, so it asks
 * which kind FIRST and collects nothing until it is answered. One overlay, one
 * journey, two entrances: the split is read off the route the funnel builds,
 * never off a second component or a second copy of a form.
 *
 * ## What is NOT claimed here
 * That `UpmAuth` logs anyone in — its forms, validation and per-mode states are
 * client-vue's own contract, doubled here at its published `SessionProps`
 * surface. What is proven is that the overlay DELEGATES every mode to it rather
 * than standing up an email+password card of its own, and that it does so
 * exactly once per mode.
 *
 * ## What Breaks If These Fail
 * The chooser appears in front of a visitor who already said where they were
 * going; add-session drops them into a login for the wrong kind of session; or
 * the journey forks into two copies of the same form and the swap link stops
 * being the one way across.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { ButtonGroup, Link } from "@upmind-automation/upmind-ui";
import { renderedStrings } from "../../../../tests/support/rendered";
import { authOverlayTarget } from "../../../funnels/labs";
import AuthOverlay from "../auth.vue";
import { difference, filter, find, forEach, map, reject } from "lodash-es";
import type { ButtonGroupItem } from "@upmind-automation/upmind-ui";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));
vi.stubGlobal("definePageMeta", () => undefined);

/** The mocked barrel is read at import time, so the double is reached by getter. */
const doubles = vi.hoisted(() => ({ auth: undefined as unknown as object }));

// The component lane's `client-vue` double is the form renderer only, while the
// real barrel also re-exports the whole of `headless` — which the funnel this
// spec drives takes its `assign` from.
vi.mock("@upmind-automation/client-vue", async importOriginal => ({
  ...(await import("@upmind-automation/headless")),
  ...((await importOriginal()) as object),
  SESSION_FORMS: {
    LOGIN: "login",
    REGISTER: "register",
    RECOVER: "recover",
    RESET: "reset",
    PROFILE: "profile",
    GUEST: "guest",
    VERIFY: "verify",
    UNKNOWN: "unknown"
  },
  get UpmAuth() {
    return doubles.auth;
  }
}));

/**
 * `UpmAuth` at its published `SessionProps` surface: the overlay is measured on
 * the mode it hands over, and the real journey renders inputs of its own that
 * would be indistinguishable from the hand-rolled card H5 rejects.
 */
const UpmAuth = defineComponent({
  name: "UpmAuth",
  props: {
    modelValue: { type: String, default: undefined },
    cancelRoute: { type: [String, Object], default: undefined }
  },
  emits: ["update:modelValue"],
  render: () => h("div")
});

doubles.auth = UpmAuth;

const PAGE = "useClientEmails";
const OVERLAY = `${PAGE}--auth`;

const MODE = { LOGIN: "login", REGISTER: "register", RECOVER: "recover" };

const blank = defineComponent({ render: () => h("div") });

const scopeSuffix = ["as", ScopeActorTypes.CLIENT];

/** The page the visitor asked for, carrying its own auth child — D2's shape. */
const routes = [
  { path: "/", name: "index", component: blank },
  {
    path: `/${PAGE}/:scopeSuffix(.*)*`,
    name: PAGE,
    component: blank,
    children: [{ path: "auth", name: OVERLAY, component: blank }]
  }
];

async function overlayOn(target: Record<string, unknown>) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(target as never);
  await router.isReady();

  const wrapper = mount(AuthOverlay as never, {
    global: { plugins: [router] }
  });
  await flushPromises();

  return wrapper;
}

/**
 * The overlay under the route the FUNNEL builds — the one place the
 * add-session ≠ log-in-to-proceed split is stated, so both entrances here are
 * the app's own rather than a query this spec invented.
 */
const overlayAt = (options: { fresh?: boolean } = {}) =>
  overlayOn(
    authOverlayTarget({ name: PAGE, params: { scopeSuffix } }, options) as never
  );

const choosers = (wrapper: VueWrapper) =>
  wrapper.findAllComponents(ButtonGroup);

const chooserItems = (wrapper: VueWrapper) =>
  (choosers(wrapper)[0]?.props("items") ?? []) as ButtonGroupItem[];

const labelled = (items: ButtonGroupItem[]) =>
  map(items, item => String((item.props as { label?: string }).label ?? ""));

const journeys = (wrapper: VueWrapper) => wrapper.findAllComponents(UpmAuth);

const mode = (wrapper: VueWrapper) => journeys(wrapper)[0]?.props("modelValue");

/** Whatever it is worded as in the mode it is read in, there is one of them. */
const swapLinks = (wrapper: VueWrapper) => wrapper.findAllComponents(Link);

async function swap(wrapper: VueWrapper) {
  await swapLinks(wrapper)[0]?.trigger("click");
  await flushPromises();
  return wrapper;
}

async function pick(wrapper: VueWrapper, scope: RegExp) {
  await find(wrapper.findAll("button"), node =>
    scope.test(node.text())
  )?.trigger("click");
  await flushPromises();
  return wrapper;
}

const named = (items: ButtonGroupItem[], scope: RegExp) =>
  filter(labelled(items), label => scope.test(label));

// -----------------------------------------------------------------------------

describe("@AC7.4 the overlay IS the whole UpmAuth journey (H5 sharpened)", () => {
  it("collects the login through client-vue's own journey, never a card of its own", async () => {
    const wrapper = await overlayAt();

    expect(journeys(wrapper)).toHaveLength(1);
    expect(mode(wrapper)).toBe(MODE.LOGIN);
    expect(wrapper.findAll("input")).toHaveLength(0);
  });

  it("swaps login ⇄ register through the ONE link, with no second copy of either form", async () => {
    const login = await overlayAt();
    expect(swapLinks(login)).toHaveLength(1);

    const register = await swap(login);

    expect(mode(register)).toBe(MODE.REGISTER);
    expect(journeys(register)).toHaveLength(1);
    expect(swapLinks(register)).toHaveLength(1);
    expect(register.findAll("input")).toHaveLength(0);

    expect(mode(await swap(register))).toBe(MODE.LOGIN);
  });

  it("carries recovering an account in the same overlay, over the same page", async () => {
    const wrapper = await overlayOn({
      name: OVERLAY,
      params: { scopeSuffix },
      query: { mode: MODE.RECOVER }
    });

    expect(mode(wrapper)).toBe(MODE.RECOVER);
    expect(journeys(wrapper)).toHaveLength(1);
    expect(wrapper.findAll("input")).toHaveLength(0);
  });
});

describe("@AC7.1 @AC7.2 the gate and add-session are different journeys (H5 sharpened)", () => {
  it("shows the login DIRECTLY, with no chooser, when the page asked for the session", async () => {
    const wrapper = await overlayAt();

    expect(choosers(wrapper)).toHaveLength(0);
    expect(journeys(wrapper)).toHaveLength(1);
    expect(mode(wrapper)).toBe(MODE.LOGIN);
  });

  it("asks which kind FIRST when a session is being added, collecting nothing until it is answered", async () => {
    const wrapper = await overlayAt({ fresh: true });

    expect(choosers(wrapper)).toHaveLength(1);
    expect(journeys(wrapper)).toHaveLength(0);
  });

  it("follows the pick with THAT kind's login, in the same overlay", async () => {
    const wrapper = await pick(await overlayAt({ fresh: true }), /staff/i);

    expect(journeys(wrapper)).toHaveLength(1);
    expect(mode(wrapper)).toBe(MODE.LOGIN);
    expect(
      map(filter(chooserItems(wrapper), "active"), item =>
        String((item.props as { label?: string }).label)
      )
    ).toEqual(named(chooserItems(wrapper), /staff/i));
  });
});

describe("@AC7.3 the chooser is three PLAIN buttons (H9)", () => {
  it("offers client, staff and impersonate as one button group", async () => {
    const items = chooserItems(await overlayAt({ fresh: true }));

    expect(items).toHaveLength(3);
    expect(map(items, "type")).toEqual(["button", "button", "button"]);

    // Matched most-specific first: the impersonate position names a client too.
    const impersonate = named(items, /impersonat/i);
    const rest = reject(labelled(items), label => /impersonat/i.test(label));

    expect(impersonate).toHaveLength(1);
    expect(filter(rest, label => /client/i.test(label))).toHaveLength(1);
    expect(filter(rest, label => /staff/i.test(label))).toHaveLength(1);
  });

  it("sits with no explanatory sentence of any kind", async () => {
    const wrapper = await overlayAt({ fresh: true });

    expect(wrapper.findAll("p")).toHaveLength(0);
    expect(
      difference(renderedStrings(wrapper), labelled(chooserItems(wrapper)))
    ).toEqual([]);
  });

  it("carries its own chooser into register, still as the one group", async () => {
    const wrapper = await swap(
      await pick(await overlayAt({ fresh: true }), /staff/i)
    );

    expect(mode(wrapper)).toBe(MODE.REGISTER);
    expect(choosers(wrapper)).toHaveLength(1);
    expect(chooserItems(wrapper)).toHaveLength(3);
  });
});
