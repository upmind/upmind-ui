// -----------------------------------------------------------------------------
/**
 * @fileoverview The shell socket — ADR 023 §7, Amendment 1 change 3
 *
 * ## Job To Be Done
 * The socket is how an app hands a domain organism the shell it renders inside
 * without the organism importing it. It must ship EMPTY, carry a host's map to
 * any descendant, answer an unknown name with `undefined` rather than throwing,
 * and follow the host when the offered map changes.
 *
 * ## What Breaks If These Fail
 * A socket that ships pre-filled puts domain entries in `foundation` and makes
 * the DAG cyclic; a socket that drops the host's map leaves every organism
 * unable to find its page, so the only way back is the import the socket exists
 * to remove.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, shallowRef } from "vue";
import { provideShellComponents, useShellComponents } from "../../../index";
import type { ShellComponents } from "../../../index";
import type { Component } from "vue";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
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

/** Mounts a probe under an optional host and reports what the socket answered. */
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
    // shallowRef: a deep ref would proxy the component objects and lose identity.
    const offered = shallowRef<ShellComponents>({ [PAGE]: first });

    const { seen } = probeUnder(() => offered.value);
    expect(seen.resolved[PAGE]).toBe(first);

    offered.value = { [ASIDE]: second };
    await flushPromises();

    expect(seen.resolved[PAGE]).toBeUndefined();
    expect(seen.resolved[ASIDE]).toBe(second);
  });
});
