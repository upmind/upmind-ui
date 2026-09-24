// -----------------------------------------------------------------------------
/**
 * @fileoverview The shell socket.
 *
 * ## Job To Be Done
 * The socket ships empty, reaches descendants, misses with `undefined`, and follows the host.
 *
 * ## What Breaks If These Fail
 * An organism cannot find its page, or domain entries in `foundation` make the graph cyclic.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, shallowRef } from "vue";
import { provideShellComponents, useShellComponents } from "../../index";
import type { ShellComponents } from "../../index";
import type { Component } from "vue";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

// -----------------------------------------------------------------------------

const PAGE = "app:page";
const ASIDE = "app:aside";

function stub(name: string): Component {
  return defineComponent({
    setup: () => () => h("div", { "data-slot": name })
  });
}

function probeUnder(host?: () => ShellComponents) {
  const seen: {
    components?: ShellComponents;
    resolved: Record<string, Component | undefined>;
  } = {
    resolved: {}
  };
  const Probe = defineComponent({
    setup() {
      const shell = useShellComponents();
      return () => {
        seen.components = shell.components.value;
        seen.resolved[PAGE] = shell.resolve(PAGE);
        seen.resolved[ASIDE] = shell.resolve(ASIDE);
        return null;
      };
    }
  });
  const Harness = defineComponent({
    setup() {
      if (host) provideShellComponents(computed(host));
      return () => h(Probe);
    }
  });

  mount(Harness);
  return { seen };
}

describe("the shell socket", () => {
  it("ships empty when no host provides one", () => {
    const { seen } = probeUnder();

    expect(seen.components).toEqual({});
    expect(seen.resolved[PAGE]).toBeUndefined();
  });

  it("carries a host's component to a descendant", () => {
    const page = stub(PAGE);

    const { seen } = probeUnder(() => ({ [PAGE]: page }));

    expect(seen.resolved[PAGE]).toBe(page);
  });

  it("answers a name the host does not offer with nothing", () => {
    const page = stub(PAGE);

    const { seen } = probeUnder(() => ({ [PAGE]: page }));

    expect(seen.resolved[ASIDE]).toBeUndefined();
  });

  it("follows the host when the offered shell changes", async () => {
    const first = stub(PAGE);
    const second = stub(ASIDE);
    const offered = shallowRef<ShellComponents>({ [PAGE]: first });

    const { seen } = probeUnder(() => offered.value);
    expect(seen.resolved[PAGE]).toBe(first);

    offered.value = { [ASIDE]: second };
    await flushPromises();

    expect(seen.resolved[PAGE]).toBeUndefined();
    expect(seen.resolved[ASIDE]).toBe(second);
  });
});
