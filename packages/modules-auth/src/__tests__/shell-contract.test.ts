// -----------------------------------------------------------------------------
/**
 * @fileoverview The raw template each auth page hands the page that mounts it.
 *
 * ## Job To Be Done
 * Each page hands its default slot the brand's raw template, unchecked, so the
 * host picks the layout from its own record; a template the host writes on the
 * page changes nothing, and the page draws its own parts inside the layout.
 *
 * ## What Breaks If These Fail
 * Every host draws one arrangement whatever the brand picks, a host overrides
 * the brand, or the page's form lands outside the host's layout.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginView from "../components/Login.vue";
import RecoverPasswordView from "../components/RecoverPassword.vue";
import RegisterView from "../components/Register.vue";
import {
  FormStub,
  handed,
  host,
  region,
  renderPage,
  resetHost,
  templateDrawn
} from "./support/auth-host";
import { uniq } from "lodash-es";

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
  { name: "register", view: RegisterView },
  { name: "recovery", view: RecoverPasswordView }
] as const;

const RAW_TEMPLATES = ["split", "inset", "mosaic", ""];

// -----------------------------------------------------------------------------

describe("the raw template an auth page hands its host", () => {
  beforeEach(() => {
    resetHost();
  });

  for (const screen of SCREENS) {
    describe(`the ${screen.name} page`, () => {
      it.each(RAW_TEMPLATES)(
        "hands its default slot the brand's raw template %j, unchecked",
        async raw => {
          host.brandTemplate = raw;

          const rendered = await renderPage(screen.view);

          expect(uniq(handed)).toEqual([raw]);
          expect(templateDrawn(rendered)).toBe(raw);
          expect(rendered.errors).toEqual([]);
        }
      );

      it("hands on the brand's template when the host writes another on the page", async () => {
        host.brandTemplate = "split";

        await renderPage(screen.view, { props: { template: "inset" } });

        expect(uniq(handed)).toEqual(["split"]);
      });

      it("draws its own form and hero inside the layout the host picks", async () => {
        host.brandTemplate = "enclosed";

        const rendered = await renderPage(screen.view);

        expect(region(rendered, "form").findComponent(FormStub).exists()).toBe(
          true
        );
        expect(region(rendered, "hero").text()).not.toBe("");
      });
    });
  }
});
