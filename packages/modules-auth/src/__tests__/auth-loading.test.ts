// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth loading interstitial.
 *
 * ## Job To Be Done
 * The loading seam always yields a component: the host's interstitial, else this package's own.
 *
 * ## What Breaks If These Fail
 * The visitor gets a blank page for the whole of the organism's setup.
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
