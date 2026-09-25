// -----------------------------------------------------------------------------
/**
 * @fileoverview The shell slots this package asks its host for.
 *
 * ## Job To Be Done
 * Every session template names a published slot, and a host filling those names is reachable.
 *
 * ## What Breaks If These Fail
 * A host that fills the published names still resolves nothing, and auth renders with no page.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import {
  provideShellComponents,
  useShellComponents
} from "@upmind-automation/foundation";
import { AUTH_SHELL, AUTH_TEMPLATE_SLOT } from "../shell";
import { AUTH_TEMPLATE } from "../types";
import type { ShellComponents } from "@upmind-automation/foundation";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const TEMPLATES = Object.values(AUTH_TEMPLATE);
const PUBLISHED_SLOTS = Object.values(AUTH_SHELL);
const TEMPLATE_SLOTS = TEMPLATES.map(template => AUTH_TEMPLATE_SLOT[template]);

function hostFilling(slots: string[]): ShellComponents {
  const filled: ShellComponents = {};
  for (const slot of slots) {
    filled[slot] = defineComponent({
      setup: () => () => h("div", { "data-slot": slot })
    });
  }
  return filled;
}

function resolveUnderHost(slots: string[], host?: ShellComponents) {
  const resolved: Record<string, Component | undefined> = {};
  const Probe = defineComponent({
    setup() {
      const shell = useShellComponents();
      for (const slot of slots) resolved[slot] = shell.resolve(slot);
      return () => null;
    }
  });
  const Harness = defineComponent({
    setup() {
      if (host) provideShellComponents(computed(() => host));
      return () => h(Probe);
    }
  });

  mount(Harness);
  return resolved;
}

describe("the auth shell contract", () => {
  it("names a slot for every session template", () => {
    for (const template of TEMPLATES) {
      expect(AUTH_TEMPLATE_SLOT[template]).toBeTruthy();
    }
  });

  it("names only published slots", () => {
    for (const slot of TEMPLATE_SLOTS) {
      expect(PUBLISHED_SLOTS).toContain(slot);
    }
  });

  it("gives each template its own slot", () => {
    expect(new Set(TEMPLATE_SLOTS).size).toBe(TEMPLATES.length);
  });

  it("keeps the interstitial and the basket summary off the template map", () => {
    expect(TEMPLATE_SLOTS).not.toContain(AUTH_SHELL.LOADING);
    expect(TEMPLATE_SLOTS).not.toContain(AUTH_SHELL.SUMMARY);
  });

  it("reaches the host component behind every published slot", () => {
    const host = hostFilling(PUBLISHED_SLOTS);

    const resolved = resolveUnderHost(PUBLISHED_SLOTS, host);

    for (const slot of PUBLISHED_SLOTS) {
      expect(resolved[slot]).toBe(host[slot]);
    }
  });

  it("resolves nothing when the host offers no shell", () => {
    const resolved = resolveUnderHost(PUBLISHED_SLOTS);

    for (const slot of PUBLISHED_SLOTS) {
      expect(resolved[slot]).toBeUndefined();
    }
  });

  it("resolves nothing for a slot this package never publishes", () => {
    const host = hostFilling(["auth:template:not-a-slot"]);

    const resolved = resolveUnderHost(PUBLISHED_SLOTS, host);

    for (const slot of PUBLISHED_SLOTS) {
      expect(resolved[slot]).toBeUndefined();
    }
  });
});
