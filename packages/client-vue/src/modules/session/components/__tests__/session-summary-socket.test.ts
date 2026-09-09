// -----------------------------------------------------------------------------
/**
 * @fileoverview The basket-summary aside at the auth socket — ADR 023 §7
 *
 * ## Job To Be Done
 * The summary aside is a basket concern, which ADR 023 §3 puts ABOVE `auth`, so
 * it cannot be imported into the session views: it arrives through the
 * `auth:summary` shell socket. That makes the socket the whole capability. A
 * host with commerce fills it and the aside appears beside the login form; a
 * host with none — the standalone app, portal-nuxt — fills nothing and gets no
 * aside and no basket fetch.
 *
 * ## What Breaks If These Fail
 * An unfilled socket renders nothing and raises nothing. Measured: deleting the
 * registration left all 16 files / 157 tests of this package green, so the
 * summary aside could be dropped from every checkout screen with every gate
 * green and no error anywhere. The sibling `auth:guest-checkout` socket was
 * guarded; this one was not.
 */

import { mount } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import type { Component, ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const HostFiller = defineComponent({
  setup: () => () => h("div", { "data-host": "filler" })
});

/** Resolves the slot from inside a descendant, exactly as an organism does. */
async function summaryUnderHost(host?: Record<string, Component>) {
  let resolved: ComputedRef<Component | undefined> | undefined;
  const { AUTH_SHELL } = await import("@upmind-automation/auth");
  const { provideShellComponents, useShellComponents } =
    await import("@upmind-automation/foundation");

  const Organism = defineComponent({
    setup() {
      const shell = useShellComponents();
      resolved = computed(() => shell.resolve(AUTH_SHELL.SUMMARY));
      return () => null;
    }
  });
  const Host = defineComponent({
    setup() {
      if (host) provideShellComponents(computed(() => host));
      return () => h(Organism);
    }
  });

  mount(Host);
  return () => resolved?.value;
}

async function shellComponents() {
  const { SESSION_SHELL_COMPONENTS } = await import("../../shell");
  return SESSION_SHELL_COMPONENTS;
}

describe("the basket-summary aside at the auth socket", () => {
  // The first resolve pays for the whole client-vue + auth + foundation graph.
  beforeAll(async () => {
    await summaryUnderHost(await shellComponents());
  }, 30000);

  it("fills the slot the session views ask for", async () => {
    const { AUTH_SHELL } = await import("@upmind-automation/auth");

    expect((await shellComponents())[AUTH_SHELL.SUMMARY]).toBeTruthy();
  });

  it("hands the organism this package's own aside, not a template", async () => {
    const { default: SessionSummary } = await import("../SessionSummary.vue");

    const slot = await summaryUnderHost(await shellComponents());

    expect(slot()).toBe(SessionSummary);
  });

  it("resolves nothing when the host fills every other auth slot but this one", async () => {
    const { AUTH_SHELL } = await import("@upmind-automation/auth");
    const partial: Record<string, Component> = {};
    for (const name of Object.values(AUTH_SHELL)) {
      if (name === AUTH_SHELL.SUMMARY) continue;
      partial[name] = HostFiller;
    }

    const slot = await summaryUnderHost(partial);

    expect(slot()).toBeUndefined();
  });

  it("resolves nothing when the host offers no shell at all", async () => {
    const slot = await summaryUnderHost();

    expect(slot()).toBeUndefined();
  });

  it("lets a host override the aside with its own", async () => {
    const { AUTH_SHELL } = await import("@upmind-automation/auth");

    const slot = await summaryUnderHost({
      ...(await shellComponents()),
      [AUTH_SHELL.SUMMARY]: HostFiller
    });

    expect(slot()).toBe(HostFiller);
  });
});
