// -----------------------------------------------------------------------------
/**
 * @fileoverview The landing this app names for its auth screens.
 *
 * ## Job To Be Done
 * `AUTH_LANDING` reaches the sign-in and sign-up organisms; recovery gets none.
 *
 * ## What Breaks If These Fail
 * A client signs in and stays on the sign-in screen with no way forward.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { clearPageGlobals, stubPageGlobals } from "./support/logged-out-host";
import type { Component } from "vue";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

// -----------------------------------------------------------------------------

const seen: {
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
}[] = [];

function recorder(name: string): Component {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: {
      loginRoute: { type: Object, default: undefined },
      registerRoute: { type: Object, default: undefined },
      recoverRoute: { type: Object, default: undefined },
      landingRoute: { type: Object, default: undefined }
    },
    setup(props, { attrs }) {
      seen.push({ props: { ...props }, attrs: { ...attrs } });
      return () => undefined;
    }
  });
}

vi.mock("@upmind-automation/auth", () => ({
  UpmAuthLogin: recorder("UpmAuthLogin"),
  UpmAuthRegister: recorder("UpmAuthRegister"),
  UpmAuthRecoverPassword: recorder("UpmAuthRecoverPassword")
}));

const PAGES = join(import.meta.dirname, "..", "app", "pages");

const CROSS_LINKS = ["loginRoute", "registerRoute", "recoverRoute"];

async function screenSeatedBy(load: () => Promise<{ default: Component }>) {
  const page = await load();
  mount(page.default);

  const recorded = seen.at(-1);
  if (recorded === undefined) throw new Error("the page seated no screen");
  return recorded;
}

// -----------------------------------------------------------------------------

describe("the landing this app names for its auth screens", () => {
  beforeEach(() => {
    seen.length = 0;
    stubPageGlobals();
  });

  afterEach(() => {
    clearPageGlobals();
  });

  it("hands the sign-in screen the landing, alongside its cross-links", async () => {
    const screen = await screenSeatedBy(() => import("~/pages/login.vue"));

    expect(screen.props.landingRoute).toEqual(AUTH_LANDING);
    expect(screen.props).toMatchObject(AUTH_ROUTES);
    expect(screen.attrs).toEqual({});
  });

  it("hands the registration screen the same landing", async () => {
    const screen = await screenSeatedBy(() => import("~/pages/register.vue"));

    expect(screen.props.landingRoute).toEqual(AUTH_LANDING);
    expect(screen.props).toMatchObject(AUTH_ROUTES);
    expect(screen.attrs).toEqual({});
  });

  it("hands the recovery screen none, so it ends on its own screen", async () => {
    const screen = await screenSeatedBy(
      () => import("~/pages/forgotten-password.vue")
    );

    expect(screen.props.landingRoute).toBeUndefined();
    expect(screen.props).toMatchObject(AUTH_ROUTES);
  });

  it("keeps the cross-links to the three screens and nothing else", () => {
    expect(Object.keys(AUTH_ROUTES).sort()).toEqual(CROSS_LINKS.sort());
  });

  it("names only routes this app has a page for", () => {
    const named = [
      AUTH_LANDING?.name,
      ...Object.values(AUTH_ROUTES).map(route => route.name)
    ];

    const missing = named.filter(
      name => !existsSync(join(PAGES, `${String(name)}.vue`))
    );

    expect(named).toHaveLength(4);
    expect(missing).toEqual([]);
  });
});
