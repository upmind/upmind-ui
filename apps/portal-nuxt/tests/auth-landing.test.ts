// -----------------------------------------------------------------------------
/**
 * @fileoverview Where this app sends a client when an auth screen hands back.
 *
 * ## Job To Be Done
 * The portal runs no funnel, so each auth page listens for the screen's hand-back:
 * a sign-in or registration lands on `AUTH_LANDING`, recovery's back returns to
 * sign-in. Each page hands its screen the portal's cross-links, and draws the
 * portal's own layout for the raw template the screen hands back.
 *
 * ## What Breaks If These Fail
 * A client signs in and stays on the sign-in screen with no way forward, or
 * recovery's back does nothing.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { clearPageGlobals, stubPageGlobals } from "./support/logged-out-host";
import {
  assign,
  concat,
  filter,
  isUndefined,
  keys,
  last,
  map,
  sortBy
} from "lodash-es";
import type { Component, Slot } from "vue";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

// -----------------------------------------------------------------------------

type Seated = {
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
  emit: (event: "resolve" | "reject") => void;
};

const seen: Seated[] = [];

/** The raw template each stood-in screen hands its page's default slot. */
const screenTemplate = { value: "" };

const { layoutStub } = vi.hoisted(() => ({
  layoutStub: async (name: string) => {
    const { defineComponent: define, h } = await import("vue");
    return {
      default: define({
        name: `Layout-${name}`,
        render: () => h("div", { "data-layout": name })
      })
    };
  }
}));

vi.mock("~/portal/auth/templates/AuthSplit.template.vue", () =>
  layoutStub("split")
);
vi.mock("~/portal/auth/templates/AuthEnclosed.template.vue", () =>
  layoutStub("enclosed")
);
vi.mock("~/portal/auth/templates/AuthCanvasCard.template.vue", () =>
  layoutStub("canvas-card")
);
vi.mock("~/portal/auth/templates/AuthSurfaceBox.template.vue", () =>
  layoutStub("surface-box")
);
vi.mock("~/portal/auth/templates/AuthLTR.template.vue", () =>
  layoutStub("two-column-ltr")
);
vi.mock("~/portal/auth/templates/AuthRTL.template.vue", () =>
  layoutStub("two-column-rtl")
);
vi.mock("~/portal/auth/templates/AuthInset.template.vue", () =>
  layoutStub("inset")
);

function recorder(name: string): Component {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: {
      loginRoute: { type: Object, default: undefined },
      registerRoute: { type: Object, default: undefined },
      recoverRoute: { type: Object, default: undefined }
    },
    emits: ["resolve", "reject"],
    setup(props, { attrs, emit, slots }) {
      seen.push({
        props: assign({}, props),
        attrs: assign({}, attrs),
        emit: event => emit(event)
      });
      return () => {
        const page: Slot | undefined = slots.default;
        return page?.({ template: screenTemplate.value });
      };
    }
  });
}

vi.mock("@upmind-automation/auth", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return assign({}, actual, {
    UpmAuthLogin: recorder("UpmAuthLogin"),
    UpmAuthRegister: recorder("UpmAuthRegister"),
    UpmAuthRecoverPassword: recorder("UpmAuthRecoverPassword")
  });
});

const PAGES = join(import.meta.dirname, "..", "app", "pages");

const CROSS_LINKS = ["loginRoute", "registerRoute", "recoverRoute"];

const SCREENS = [
  ["sign-in", () => import("~/pages/login.vue")],
  ["registration", () => import("~/pages/register.vue")],
  ["recovery", () => import("~/pages/forgotten-password.vue")]
] as const;

async function mountPage(load: () => Promise<{ default: Component }>) {
  const page = await load();
  return mount(page.default);
}

async function screenSeatedBy(load: () => Promise<{ default: Component }>) {
  await mountPage(load);

  const recorded = last(seen);
  if (isUndefined(recorded)) throw new Error("the page seated no screen");
  return recorded;
}

function navigateTo() {
  return Reflect.get(globalThis, "navigateTo");
}

// -----------------------------------------------------------------------------

describe("where this app sends a client when an auth screen hands back", () => {
  beforeEach(() => {
    seen.length = 0;
    screenTemplate.value = "";
    stubPageGlobals();
  });

  afterEach(() => {
    clearPageGlobals();
  });

  it("lands a client who signs in on the landing", async () => {
    const screen = await screenSeatedBy(() => import("~/pages/login.vue"));

    screen.emit("resolve");

    expect(navigateTo()).toHaveBeenCalledWith(AUTH_LANDING);
  });

  it("lands a client who registers on the same landing", async () => {
    const screen = await screenSeatedBy(() => import("~/pages/register.vue"));

    screen.emit("resolve");

    expect(navigateTo()).toHaveBeenCalledWith(AUTH_LANDING);
  });

  it("sends recovery's back to the sign-in screen", async () => {
    const screen = await screenSeatedBy(
      () => import("~/pages/forgotten-password.vue")
    );

    screen.emit("reject");

    expect(navigateTo()).toHaveBeenCalledWith(AUTH_ROUTES.loginRoute);
  });

  it("goes nowhere before a screen hands back", async () => {
    await screenSeatedBy(() => import("~/pages/login.vue"));

    expect(navigateTo()).not.toHaveBeenCalled();
  });

  it.each(SCREENS)(
    "hands the %s screen its cross-links, and no record or landing",
    async (_name, load) => {
      const screen = await screenSeatedBy(load);

      expect(screen.props).toMatchObject(AUTH_ROUTES);
      expect(screen.attrs).not.toHaveProperty("templates");
      expect(screen.attrs).not.toHaveProperty("landingRoute");
    }
  );

  it.each(SCREENS)(
    "draws the portal's layout for the raw template the %s screen hands back",
    async (_name, load) => {
      screenTemplate.value = "inset";

      const page = await mountPage(load);

      expect(page.find("[data-layout]").attributes("data-layout")).toBe(
        "inset"
      );
    }
  );

  it("keeps the cross-links to the three screens and nothing else", () => {
    expect(sortBy(keys(AUTH_ROUTES))).toEqual(sortBy(CROSS_LINKS));
  });

  it("names only routes this app has a page for", () => {
    const named = concat([AUTH_LANDING?.name], map(AUTH_ROUTES, "name"));

    const missing = filter(
      named,
      name => !existsSync(join(PAGES, `${String(name)}.vue`))
    );

    expect(named).toHaveLength(4);
    expect(missing).toEqual([]);
  });
});
