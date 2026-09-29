// -----------------------------------------------------------------------------
/**
 * @fileoverview The page templates each auth page takes from the page that mounts it.
 *
 * ## Job To Be Done
 * Each page draws the host's template for the brand's chosen arrangement and
 * hands it the page's props but not the record.
 *
 * ## What Breaks If These Fail
 * A page draws the wrong arrangement or leaks the record onto the template.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginView from "../components/Login.vue";
import RecoverPasswordView from "../components/RecoverPassword.vue";
import RegisterView from "../components/Register.vue";
import { AUTH_TEMPLATE } from "../types";
import {
  FormStub,
  ROUTES,
  host,
  renderPage,
  resetHost,
  seen,
  templateDrawn
} from "./support/auth-host";
import { find, values } from "lodash-es";

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

const ARRANGEMENTS = values(AUTH_TEMPLATE);

// -----------------------------------------------------------------------------

describe("the page templates an auth page takes from its host", () => {
  beforeEach(() => {
    resetHost();
  });

  for (const screen of SCREENS) {
    describe(`the ${screen.name} page`, () => {
      it.each(ARRANGEMENTS)(
        "draws the host's template when the brand picks %s",
        async arrangement => {
          host.brandTemplate = arrangement;

          const rendered = await renderPage(screen.view);

          expect(templateDrawn(rendered)).toBe(arrangement);
          expect(rendered.errors).toEqual([]);
        }
      );

      it("hands the template its routes, and not the record", async () => {
        host.brandTemplate = AUTH_TEMPLATE.SPLIT;

        await renderPage(screen.view);
        const drawn = find(seen, { name: AUTH_TEMPLATE.SPLIT });

        expect(drawn?.props).toMatchObject(ROUTES);
        expect(drawn?.attrs).not.toHaveProperty("templates");
      });

      it("draws the page's own form inside the template", async () => {
        host.brandTemplate = AUTH_TEMPLATE.ENCLOSED;

        const rendered = await renderPage(screen.view);

        expect(rendered.wrapper.findComponent(FormStub).exists()).toBe(true);
      });
    });
  }
});
