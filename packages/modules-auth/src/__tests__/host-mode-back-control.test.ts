// -----------------------------------------------------------------------------
/**
 * @fileoverview How the session screens hand back: the funnel's step, or an event.
 *
 * ## Job To Be Done
 * With a funnel running, a screen takes the funnel's next and back steps and
 * emits nothing. With none, login and register render no back control, every
 * screen emits `resolve` or `reject` for its host to act on, and none navigates.
 *
 * ## What Breaks If These Fail
 * A funnel-free host offers a back that throws, a funnel host loses its way back
 * to the basket, or a host that listens for the hand-back never hears it.
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginView from "../Login.vue";
import RecoverPasswordView from "../RecoverPassword.vue";
import RegisterView from "../Register.vue";
import {
  START,
  host,
  navigate,
  navigateBack,
  navigateNext,
  renderPage,
  resetHost,
  submit
} from "./support/auth-host";
import { filter, find, map, size } from "lodash-es";
import type { Rendered } from "./support/auth-host";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

// Mocked at its source so every reader inside `headless` sees the same engine.
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

const CONTROL = '[role="button"], button, a';

const SCREENS = [
  { name: "login", view: LoginView },
  { name: "register", view: RegisterView },
  { name: "recovery", view: RecoverPasswordView }
] as const;

function controlsIn(rendered: Rendered) {
  return rendered.wrapper.findAll(CONTROL);
}

function signatureOf(control: ReturnType<typeof controlsIn>[number]) {
  const key = control.attributes("data-test-key") ?? "";
  return `${control.element.tagName}|${key}|${control.text()}`;
}

type Activation = {
  signature: string;
  reachedFunnelBack: boolean;
  rejected: number;
  landedOn: string;
};

async function sweep(view: Component): Promise<Activation[]> {
  const count = size(controlsIn(await renderPage(view)));
  const activations: Activation[] = [];

  for (let index = 0; index < count; index += 1) {
    navigateBack.mockClear();
    const rendered = await renderPage(view);
    const control = controlsIn(rendered)[index];
    if (!control) continue;
    const signature = signatureOf(control);

    await control.trigger("click");
    await flushPromises();

    activations.push({
      signature,
      reachedFunnelBack: size(navigateBack.mock.calls) > 0,
      rejected: size(rendered.page.emitted("reject")),
      landedOn: rendered.router.currentRoute.value.path
    });
  }

  return activations;
}

function inventoryOf(activations: Activation[]) {
  return map(activations, "signature");
}

function backStepIn(activations: Activation[]) {
  return filter(activations, "reachedFunnelBack");
}

// -----------------------------------------------------------------------------

describe("the session screens' back control", () => {
  beforeEach(() => {
    resetHost();
  });

  describe("in a host that drives funnels", () => {
    for (const screen of SCREENS) {
      it(`gives ${screen.name} exactly one control, and it takes the funnel's back step`, async () => {
        const activations = await sweep(screen.view);
        const back = backStepIn(activations);

        expect(back).toHaveLength(1);
        expect(back[0]?.landedOn).toBe(START);
        expect(back[0]?.rejected).toBe(0);
      });
    }
  });

  describe("in a host that drives no funnel", () => {
    for (const screen of [SCREENS[0], SCREENS[1]]) {
      it(`takes ${screen.name}'s control away and leaves the rest of the screen alone`, async () => {
        const withFunnels = await sweep(screen.view);
        const [back] = backStepIn(withFunnels);
        host.hasFunnels = false;
        const withoutFunnels = await sweep(screen.view);

        expect(back).toBeDefined();
        expect(inventoryOf(withoutFunnels)).toEqual(
          filter(
            inventoryOf(withFunnels),
            signature => signature !== back?.signature
          )
        );
        expect(backStepIn(withoutFunnels)).toEqual([]);
      });
    }

    it("keeps recovery's control, and it hands back to the host as a reject", async () => {
      const withFunnels = await sweep(SCREENS[2].view);
      const [back] = backStepIn(withFunnels);
      host.hasFunnels = false;
      const withoutFunnels = await sweep(SCREENS[2].view);
      const control = find(withoutFunnels, { signature: back?.signature });

      expect(inventoryOf(withoutFunnels)).toEqual(inventoryOf(withFunnels));
      expect(backStepIn(withoutFunnels)).toEqual([]);
      expect(control?.rejected).toBe(1);
      expect(control?.landedOn).toBe(START);
    });
  });
});

describe("the session screens' hand-back after a successful submit", () => {
  beforeEach(() => {
    resetHost();
  });

  for (const screen of SCREENS) {
    it(`takes the funnel's next step from ${screen.name}, and emits nothing`, async () => {
      const rendered = await renderPage(screen.view);

      await submit(rendered);

      expect(navigateNext).toHaveBeenCalledTimes(1);
      expect(rendered.page.emitted("resolve")).toBeUndefined();
    });

    it(`emits resolve from ${screen.name} in a funnel-free host, and stays put`, async () => {
      host.hasFunnels = false;
      const rendered = await renderPage(screen.view);

      await submit(rendered);

      expect(rendered.page.emitted("resolve")).toEqual([[]]);
      expect(navigateNext).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(rendered.router.currentRoute.value.path).toBe(START);
    });
  }
});
