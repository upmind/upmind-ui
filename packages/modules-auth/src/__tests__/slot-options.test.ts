// -----------------------------------------------------------------------------
/**
 * @fileoverview The options a host layout sets on the auth pages' slots.
 *
 * ## Job To Be Done
 * Each page draws its back link, form and markdown the way the layout asks on
 * the slot, and the way it always did where the layout asks nothing: a full
 * back link, an uncarded active form with the brand's copy, a guest offer flush
 * with the form, and markdown set apart from it.
 *
 * ## What Breaks If These Fail
 * A carded layout draws a form with no cross-link, a compact layout
 * draws the long back link, the guest offer loses its spacing, or markdown
 * keeps a gap the layout removed.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { Back } from "@upmind-automation/foundation";
import LoginView from "../components/Login.vue";
import RecoverPasswordView from "../components/RecoverPassword.vue";
import RegisterView from "../components/Register.vue";
import { GUEST_CHECKOUT_SPACING } from "../types";
import {
  host,
  recordingLayout,
  region,
  renderPage,
  resetHost
} from "./support/auth-host";
import { last } from "lodash-es";
import type { AuthGuestCheckoutSlotProps } from "../types";
import type { Rendered, SlotOptions } from "./support/auth-host";

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
  { name: "login", view: LoginView, back: "action.back_to_basket" },
  { name: "register", view: RegisterView, back: "action.back_to_basket" },
  { name: "recovery", view: RecoverPasswordView, back: "action.back_to_login" }
] as const;

const FORM_SCREENS = [
  { name: "login", view: LoginView },
  { name: "register", view: RegisterView }
] as const;

const BODY = "Welcome back";

const CROSS_LINK = '[data-slot="tabs-header-append"]';

function withOptions(
  view: (typeof SCREENS)[number]["view"],
  options: SlotOptions,
  slots = {}
): Promise<Rendered> {
  return renderPage(view, {
    layout: recordingLayout("options", options),
    slots
  });
}

const formSection = (rendered: Rendered) =>
  region(rendered, "form").find('[data-test-key="section"]');

const markdownOf = (rendered: Rendered) =>
  region(rendered, "markdown").find(":scope > *");

const backLink = (rendered: Rendered) =>
  region(rendered, "back").findComponent(Back);

// -----------------------------------------------------------------------------

describe("the back slot's options", () => {
  beforeEach(() => {
    resetHost();
  });

  it.each(SCREENS)(
    "draws the $name page's full back link by default, and the compact one where the layout says",
    async screen => {
      const plain = await withOptions(screen.view, {});
      const compact = await withOptions(screen.view, {
        back: { compact: true }
      });

      expect(backLink(plain).props()).toMatchObject({
        label: screen.back,
        color: "default"
      });
      expect(backLink(compact).props()).toMatchObject({
        label: "action.back",
        icon: "arrow-narrow-left",
        color: "muted"
      });
    }
  );
});

describe("the form slot's options", () => {
  beforeEach(() => {
    resetHost();
  });

  it.each(FORM_SCREENS)(
    "draws the $name page's form with no cross-link by default, and with one where the layout cards it",
    async screen => {
      const plain = await withOptions(screen.view, {});
      const carded = await withOptions(screen.view, { form: { card: true } });

      expect(formSection(plain).find(CROSS_LINK).exists()).toBe(false);
      expect(formSection(carded).find(CROSS_LINK).exists()).toBe(true);
    }
  );

  it.each(FORM_SCREENS)(
    "keeps the $name page's form active with the brand's copy by default, and drops the copy where the layout makes it inactive",
    async screen => {
      host.clientTemplateBody = BODY;

      const plain = await withOptions(screen.view, {});
      const inactive = await withOptions(screen.view, {
        form: { active: false }
      });

      expect(region(plain, "form").text()).toContain(BODY);
      expect(region(inactive, "form").text()).not.toContain(BODY);
    }
  );

  it.each([
    [GUEST_CHECKOUT_SPACING.BELOW, "mt-0 mb-6"],
    [GUEST_CHECKOUT_SPACING.AROUND, "mt-6 mb-6"],
    [GUEST_CHECKOUT_SPACING.NONE, ""]
  ])(
    "spaces the guest offer %s where the layout says, and flush by default",
    async (spacing, spaced) => {
      const received: AuthGuestCheckoutSlotProps[] = [];
      const offer = (props: AuthGuestCheckoutSlotProps) => {
        received.push(props);
        return h("button", "Checkout as guest");
      };

      await withOptions(RegisterView, {}, { "guest-checkout": offer });
      const flush = last(received)?.class;
      await withOptions(
        RegisterView,
        { form: { guestSpacing: spacing } },
        { "guest-checkout": offer }
      );

      expect(flush).toBe("mt-0 mb-0");
      expect(last(received)?.class).toBe(spaced);
    }
  );
});

describe("the markdown slot's options", () => {
  beforeEach(() => {
    resetHost();
    host.clientTemplateBody = BODY;
  });

  it.each(FORM_SCREENS)(
    "sets the $name page's markdown apart by default, and flush where the layout says",
    async screen => {
      const plain = await withOptions(screen.view, {});
      const flush = await withOptions(screen.view, {
        markdown: { flush: true }
      });

      expect(markdownOf(plain).text()).toContain(BODY);
      expect(markdownOf(plain).classes()).toContain("my-6");
      expect(markdownOf(flush).text()).toContain(BODY);
      expect(markdownOf(flush).classes()).not.toContain("my-6");
    }
  );
});
