// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth loading interstitial — ADR 023 §7 shell socket
 *
 * ## Job To Be Done
 * Each session organism's body is async, so the package owns the `<Suspense>`
 * boundary at its own public export seam and takes the `#fallback` from this
 * seam. The seam must therefore ALWAYS yield a component: a host that fills
 * `AUTH_SHELL.LOADING` gets its own interstitial, and a host that fills nothing
 * — the standalone auth app, portal-nuxt — falls through to this package's own.
 *
 * ## What Breaks If These Fail
 * The fallback resolves to `undefined`, so the visitor gets a blank page for the
 * whole of the organism's setup — the empty body the boundary exists to remove.
 * A green build cannot see it, because nothing about it fails to compile.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h, shallowRef } from "vue";
import { createI18n } from "vue-i18n";
import { provideShellComponents } from "@upmind-automation/foundation";
import { AUTH_SHELL } from "../index";
import { useAuthLoading } from "../shell";
import type { ShellComponents } from "@upmind-automation/foundation";
import type { Component, ComputedRef, ShallowRef } from "vue";

// -----------------------------------------------------------------------------

/** The interstitial's copy comes from the host's i18n; the catalogue is not. */
const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false
});

const HostLoading = defineComponent({
  setup: () => () => h("div", { "data-host": "loading" })
});

const HostTemplate = defineComponent({
  setup: () => () => h("div", { "data-host": "template" })
});

/** Reads the seam from inside a descendant, the way an organism does. */
function loadingUnderHost(
  host?: ShallowRef<ShellComponents>
): ComputedRef<Component> {
  let captured: ComputedRef<Component> | undefined;
  const Probe = defineComponent({
    setup() {
      captured = useAuthLoading().component;
      return () => null;
    }
  });
  const Harness = defineComponent({
    setup() {
      if (host) provideShellComponents(computed(() => host.value));
      return () => h(Probe);
    }
  });

  mount(Harness);
  if (!captured) throw new Error("the probe never reached useAuthLoading");
  return captured;
}

describe("the auth loading interstitial", () => {
  it("yields this package's own interstitial when the host offers no shell", () => {
    const { value } = loadingUnderHost();

    expect(value).toBeTruthy();
  });

  it("renders content a visitor can see, not an empty node", () => {
    const { value } = loadingUnderHost();

    const rendered = mount(value, { global: { plugins: [i18n] } });

    expect(rendered.html().trim()).not.toBe("");
  });

  it("hands over to the host's interstitial when the host fills the slot", () => {
    const host = shallowRef({ [AUTH_SHELL.LOADING]: HostLoading });

    const { value } = loadingUnderHost(host);

    expect(value).toBe(HostLoading);
  });

  it("falls through when the host fills every other slot but this one", () => {
    const host = shallowRef({
      [AUTH_SHELL.TEMPLATE_SPLIT]: HostTemplate,
      [AUTH_SHELL.SUMMARY]: HostTemplate
    });

    const { value } = loadingUnderHost(host);

    expect(value).toBeTruthy();
    expect(value).not.toBe(HostTemplate);
  });

  it("follows the host's shell as it changes", () => {
    const host: ShallowRef<ShellComponents> = shallowRef({});

    const component = loadingUnderHost(host);
    const fallback = component.value;
    host.value = { [AUTH_SHELL.LOADING]: HostLoading };

    expect(fallback).toBeTruthy();
    expect(component.value).toBe(HostLoading);
  });
});
