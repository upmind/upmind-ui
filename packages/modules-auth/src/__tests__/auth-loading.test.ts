// -----------------------------------------------------------------------------
/**
 * @fileoverview The `loading` slot the sign-in and registration pages draw while they hand on.
 *
 * ## Job To Be Done
 * Once a sign-in hands on to the funnel's next step, the page draws the host's
 * `loading` fill, or this package's own interstitial when the host fills none,
 * and returns to its template if the step fails.
 *
 * ## What Breaks If These Fail
 * The visitor watches the sign-in form sit there after a successful sign-in, or
 * gets a blank page for the whole hand-on.
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import LoginView from "../Login.vue";
import RegisterView from "../Register.vue";
import {
  navigateNext,
  renderPage,
  resetHost,
  submit,
  templateDrawn
} from "./support/auth-host";

// -----------------------------------------------------------------------------

vi.mock("../../../headless/src/modules/routing/useRoutingEngine", () =>
  import("./support/auth-host").then(support => support.routingEngine())
);

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const support = await import("./support/auth-host");
  const { assign } = await import("lodash-es");
  return assign({}, actual, support.headlessOverrides());
});

vi.mock("@upmind-automation/foundation", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const support = await import("./support/auth-host");
  const { assign } = await import("lodash-es");
  return assign({}, actual, { Form: support.FormStub });
});

const SCREENS = [
  { name: "login", view: LoginView },
  { name: "register", view: RegisterView }
] as const;

const HOST_LOADING = "[data-host-loading]";

const hostLoading = () =>
  h("div", { "data-host-loading": "" }, "Taking you on");

function holdTheNextStep(): () => void {
  let fail: () => void = () => undefined;
  navigateNext.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = () => reject(new Error("the next step failed"));
      })
  );
  return () => fail();
}

// -----------------------------------------------------------------------------

describe("the loading slot while a sign-in hands on", () => {
  beforeEach(() => {
    resetHost();
  });

  for (const screen of SCREENS) {
    describe(`the ${screen.name} page`, () => {
      it("draws the template, not the fill, before the visitor signs in", async () => {
        const rendered = await renderPage(screen.view, {
          slots: { loading: hostLoading }
        });

        expect(templateDrawn(rendered)).toBeDefined();
        expect(rendered.wrapper.find(HOST_LOADING).exists()).toBe(false);
      });

      it("draws the host's fill in place of the template while the next step runs", async () => {
        holdTheNextStep();
        const rendered = await renderPage(screen.view, {
          slots: { loading: hostLoading }
        });

        await submit(rendered);

        expect(navigateNext).toHaveBeenCalledTimes(1);
        expect(rendered.wrapper.find(HOST_LOADING).exists()).toBe(true);
        expect(templateDrawn(rendered)).toBeUndefined();
      });

      it("draws this package's own interstitial when the host fills none", async () => {
        holdTheNextStep();
        const rendered = await renderPage(screen.view);

        await submit(rendered);

        expect(templateDrawn(rendered)).toBeUndefined();
        expect(rendered.wrapper.html().trim()).not.toBe("");
        expect(rendered.wrapper.text()).not.toBe("");
      });

      it("returns to the template when the next step fails", async () => {
        const fail = holdTheNextStep();
        const rendered = await renderPage(screen.view, {
          slots: { loading: hostLoading }
        });
        await submit(rendered);

        fail();
        await flushPromises();

        expect(rendered.wrapper.find(HOST_LOADING).exists()).toBe(false);
        expect(templateDrawn(rendered)).toBeDefined();
      });
    });
  }
});
