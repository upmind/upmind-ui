// -----------------------------------------------------------------------------
/**
 * @fileoverview scope.devtools — what the live-scope inspector reports (unit)
 *
 * ## Job To Be Done
 * The inspector reads a scope back OUT of its key, and a catalogue key carries
 * ONE unprefixed segment where a retargeted key carries two. Prove the reader
 * reports a catalogue as the context it is, attributes no entity to it, and
 * lands the brand filter in a brand field rather than in the entity field.
 *
 * The field NAMES are never hard-coded: a retargeted scope with known values is
 * inspected first, and the fields carrying its context type and its entity id
 * are discovered from it. A test that guessed the labels would go green on a
 * reader that had silently stopped reporting anything at all.
 *
 * ## What Breaks If These Fail
 * The brand filter is reported as the entity being acted upon, and an operator
 * debugging a live scope is sent after a client id that does not exist.
 *
 * @anchor scope.feature
 * @anchor AC-5
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import { find, flatMap, map, values } from "lodash-es";
import type { RegistryEntry } from "../scope.registry";
import type { ScopeKey } from "../scope.types";

// -----------------------------------------------------------------------------

type StateEntry = { key: string; value: unknown };

let apiCalls: Record<string, unknown[][]> = {};
let hooks: Record<string, (...args: unknown[]) => unknown> = {};

const on = new Proxy(
  {},
  {
    get:
      (_target, hook: string) =>
      (handler: (...args: unknown[]) => unknown): void => {
        hooks[hook] = handler;
      }
  }
);

const api = new Proxy(
  {},
  {
    get: (_target, member: string) =>
      member === "on"
        ? on
        : (...args: unknown[]) => {
            (apiCalls[member] ??= []).push(args);
          }
  }
);

vi.mock("@vue/devtools-api", () => ({
  setupDevToolsPlugin: (
    _descriptor: unknown,
    setup: (devtoolsApi: unknown) => void
  ) => setup(api)
}));

// -----------------------------------------------------------------------------

/** A retargeted scope, brand-filtered. Every value here is distinct, so the
 *  field carrying each one is discoverable without naming it. */
const RETARGETED = "client-custom-fields:client:contract:c-9:brand:brand-abc";

/** The same module, same actor, same brand — read through a catalogue instead
 *  of an entity. This key carries one unprefixed segment, not two. */
const CATALOGUE = "client-custom-fields:client:invoice:brand:brand-abc";

/**
 * Boots the devtools plugin over a registry holding both scopes and hands back
 * what the inspector reports for each.
 *
 * @returns One flattened `{ key, value }` list per scope key.
 */
async function inspect(): Promise<Record<ScopeKey, StateEntry[]>> {
  const { setupScopeDevtools } = await import("../scope.devtools");

  const registry = new Map<ScopeKey, RegistryEntry>(
    map([RETARGETED, CATALOGUE], key => [
      key,
      { instance: { key }, scope: effectScope(true) } as RegistryEntry
    ])
  );

  setupScopeDevtools({} as never, registry);

  const inspectorId = (
    apiCalls.addInspector?.[0]?.[0] as { id: string } | undefined
  )?.id;
  expect(inspectorId).toBeTruthy();

  const read = (nodeId: ScopeKey): StateEntry[] => {
    const payload = {
      app: {},
      inspectorId,
      nodeId,
      state: {} as Record<string, StateEntry[]>
    };
    hooks.getInspectorState?.(payload, {});
    return flatMap(values(payload.state));
  };

  return { [RETARGETED]: read(RETARGETED), [CATALOGUE]: read(CATALOGUE) };
}

// -----------------------------------------------------------------------------

describe("the live-scope inspector (AC-5)", () => {
  beforeEach(() => {
    // The plugin registers its hooks into these two records every boot. Left
    // standing, a case reads the PREVIOUS case's inspector and its handler.
    apiCalls = {};
    hooks = {};
  });

  it("@AC-5 reports a catalogue read as the context it is", async () => {
    const reported = await inspect();

    const contextField = find(reported[RETARGETED], {
      value: "contract"
    })?.key;
    expect(contextField).toBeTruthy();

    expect(find(reported[CATALOGUE], { key: contextField })?.value).toBe(
      "invoice"
    );
  });

  it("@AC-5 attributes no entity to a catalogue read", async () => {
    const reported = await inspect();

    const entityField = find(reported[RETARGETED], { value: "c-9" })?.key;
    expect(entityField).toBeTruthy();

    // A catalogue has no entity, so the field must be absent. The failure this
    // guards is the reader taking the NEXT segment positionally: the brand's
    // own `brand:` prefix arrives as the entity being acted upon.
    expect(find(reported[CATALOGUE], { key: entityField })).toBeUndefined();
    expect(map(reported[CATALOGUE], "value")).not.toContain("brand");
  });

  it("@AC-5 reports the brand filter as the brand it filters to", async () => {
    const reported = await inspect();

    const contextField = find(reported[RETARGETED], {
      value: "contract"
    })?.key;
    const entityField = find(reported[RETARGETED], { value: "c-9" })?.key;
    expect([contextField, entityField]).not.toContain(undefined);

    const brandEntry = find(reported[CATALOGUE], { value: "brand-abc" });

    expect(brandEntry).toBeDefined();
    expect(brandEntry?.key).not.toBe(contextField);
    expect(brandEntry?.key).not.toBe(entityField);
  });
});
