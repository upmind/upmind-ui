// -----------------------------------------------------------------------------
/**
 * @fileoverview The `summary` and `guest-checkout` slots the host page fills.
 *
 * ## Job To Be Done
 * The pages put the host's basket summary in the template's summary region when
 * the brand shows it, and draw nothing of their own there. Registration hands
 * the host's guest-checkout offer a verb that registers the visitor as a guest
 * and hands on, and tells it while that registration runs.
 *
 * ## What Breaks If These Fail
 * The basket summary vanishes beside the forms, shows where the brand hid it,
 * or the guest-checkout offer registers nobody or never moves the visitor on.
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import LoginView from "../Login.vue";
import RecoverPasswordView from "../RecoverPassword.vue";
import RegisterView from "../Register.vue";
import {
  host,
  navigateNext,
  region,
  registerAsGuestMock,
  renderPage,
  resetHost
} from "./support/auth-host";
import { last } from "lodash-es";
import type {
  AuthGuestCheckoutSlotProps,
  AuthSummarySlotProps
} from "../types";

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

const HOST_SUMMARY = "[data-host-summary]";

const HOST_OFFER = "[data-host-offer]";

const SUMMARY_SCREENS = [
  { name: "login", view: LoginView, showWhileLoading: false },
  { name: "register", view: RegisterView, showWhileLoading: true }
] as const;

function summaryFill() {
  const received: AuthSummarySlotProps[] = [];
  const slot = (props: AuthSummarySlotProps) => {
    received.push(props);
    return h("aside", { "data-host-summary": "" }, "Your basket");
  };
  return { received, slot };
}

function offerFill() {
  const received: AuthGuestCheckoutSlotProps[] = [];
  const slot = (props: AuthGuestCheckoutSlotProps) => {
    received.push(props);
    return h("button", { "data-host-offer": "" }, "Checkout as guest");
  };
  return { received, slot };
}

// -----------------------------------------------------------------------------

describe("the summary slot", () => {
  beforeEach(() => {
    resetHost();
  });

  for (const screen of SUMMARY_SCREENS) {
    describe(`the ${screen.name} page`, () => {
      it("puts the host's summary in the template's summary region when the brand shows it", async () => {
        host.basketSummaryVisible = true;
        const fill = summaryFill();

        const rendered = await renderPage(screen.view, {
          slots: { summary: fill.slot }
        });

        expect(region(rendered, "summary").find(HOST_SUMMARY).exists()).toBe(
          true
        );
        expect(last(fill.received)).toEqual({
          showWhileLoading: screen.showWhileLoading
        });
      });

      it("draws no summary where the brand hides it", async () => {
        const fill = summaryFill();

        const rendered = await renderPage(screen.view, {
          slots: { summary: fill.slot }
        });

        expect(rendered.wrapper.find(HOST_SUMMARY).exists()).toBe(false);
        expect(region(rendered, "summary").exists()).toBe(false);
      });

      it("draws nothing of its own there when the host fills no summary", async () => {
        host.basketSummaryVisible = true;

        const rendered = await renderPage(screen.view);

        expect(region(rendered, "summary").text()).toBe("");
      });
    });
  }

  it("hands the recovery page's summary the no-loading flag", async () => {
    host.basketSummaryVisible = true;
    const fill = summaryFill();

    const rendered = await renderPage(RecoverPasswordView, {
      slots: { summary: fill.slot }
    });

    expect(region(rendered, "summary").find(HOST_SUMMARY).exists()).toBe(true);
    expect(last(fill.received)).toEqual({ showWhileLoading: false });
  });
});

describe("the guest-checkout slot", () => {
  beforeEach(() => {
    resetHost();
  });

  it("draws the host's offer on the registration page", async () => {
    const fill = offerFill();

    const rendered = await renderPage(RegisterView, {
      slots: { "guest-checkout": fill.slot }
    });

    expect(rendered.wrapper.find(HOST_OFFER).exists()).toBe(true);
    expect(last(fill.received)?.isRegistering).toBe(false);
  });

  it("registers the visitor as a guest and takes the funnel's next step", async () => {
    const fill = offerFill();
    await renderPage(RegisterView, { slots: { "guest-checkout": fill.slot } });

    await last(fill.received)?.registerAsGuest();
    await flushPromises();

    expect(registerAsGuestMock).toHaveBeenCalledTimes(1);
    expect(navigateNext).toHaveBeenCalledTimes(1);
  });

  it("registers the visitor as a guest and hands back in a funnel-free host", async () => {
    host.hasFunnels = false;
    const fill = offerFill();
    const rendered = await renderPage(RegisterView, {
      slots: { "guest-checkout": fill.slot }
    });

    await last(fill.received)?.registerAsGuest();
    await flushPromises();

    expect(registerAsGuestMock).toHaveBeenCalledTimes(1);
    expect(rendered.page.emitted("resolve")).toEqual([[]]);
    expect(navigateNext).not.toHaveBeenCalled();
  });

  it("tells the offer while the guest registration runs", async () => {
    host.isRegisteringAsGuest = true;
    const fill = offerFill();

    await renderPage(RegisterView, { slots: { "guest-checkout": fill.slot } });

    expect(last(fill.received)?.isRegistering).toBe(true);
  });
});
