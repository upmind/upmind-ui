// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/scenario-harness/adapter
 * @description The @AC-2 test-side adapter: builds a `CompositionPort` from
 * live `useAuth` layer-factory returns. Lives OUTSIDE
 * `packages/scenario-harness/**` — the core has a lint boundary banning
 * headless (and vue) imports, even in its own tests; this adapter is the
 * journeys-layer consumer that is allowed to import both, mirroring what a
 * future renderer's own adapter will do.
 *
 * Booting always chains `.fresh()`: `isNewSession` is a synchronous machine
 * guard (`auth.machine.ts` `checking.always`), so a fresh instance lands on
 * `idle` with no network call and no shared-registry collision between tests
 * (`scope.utils.ts` `generateScopeKey` — a `fresh:` suffix is unique per
 * call). This keeps reflection tests deterministic and network-free.
 */

import { unref } from "vue";
import { useAuth } from "@upmind-automation/headless";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { CompositionPort } from "@upmind-automation/scenario-harness";

/** This suite only needs the two actors the @AC-2 scenarios drive (client/staff) — both carry a valid `AUTH_SCOPE_MATRIX` context, so `.as(actor)` resolves to the fluent (`.fresh()`-bearing) overload; a wider `ScopeActor` union collapses to the finalized (non-fluent) overload instead. */
export type AuthTestActor = ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF;

type Derefable = Record<string, unknown>;

function toPlainRecord(source: Derefable): Record<string, unknown> {
  const plain: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    plain[key] = unref(source[key] as never);
  }
  return plain;
}

export interface AuthBoot {
  port: CompositionPort;
  /** The real `useActions()` return — for driving the module in a test. */
  actions: Record<string, (input?: unknown) => unknown>;
  destroy: () => void;
}

/**
 * Boots `useAuth` as `actor` (always `.fresh()`, never session-probed) and
 * builds a `CompositionPort` from ONLY its three named layer members —
 * `.useActions()` / `.useContext()` / `.useMeta()` — never enumerating the
 * builder Proxy: enumerating it (e.g. `Object.keys`/spread) would
 * side-effectfully instantiate through `scope.builder.ts:266-328`'s
 * `ownKeys` trap instead of the deliberate named-member boot.
 */
export function bootAuthPort(actor: AuthTestActor): AuthBoot {
  const auth = useAuth().as(actor).fresh();

  const actions = auth.useActions() as unknown as Record<
    string,
    (input?: unknown) => unknown
  >;
  const context = auth.useContext() as unknown as Derefable;
  const meta = auth.useMeta() as unknown as Derefable;

  const port: CompositionPort = {
    snapshot: () => ({
      actions: Object.keys(actions),
      context: toPlainRecord(context),
      meta: toPlainRecord(meta) as Record<string, boolean>
    }),
    getMeta: () => toPlainRecord(meta) as Record<string, boolean>,
    actions: actions as unknown as CompositionPort["actions"]
  };

  return { port, actions, destroy: () => actions.destroy() };
}

interface EnumerationSpy {
  ownKeysCalls: number;
  getOwnPropertyDescriptorCalls: number;
  hasCalls: number;
}

/**
 * Wraps a target (the raw `useAuth()` builder, before `.as()`/`.fresh()`/any
 * named-member access) in a Proxy that only counts enumeration-trap calls —
 * `ownKeys` / `getOwnPropertyDescriptor` / `has` — without altering behaviour
 * for named-property `get`. Used to prove reflection's "no builder
 * enumeration" invariant (enumerating a builder-alike port side-effectfully
 * instantiates it) against the REAL scope builder, without needing to spy
 * inside `scope.builder.ts` itself.
 */
export function wrapWithEnumerationSpy<T extends object>(
  target: T
): { proxy: T; spy: EnumerationSpy } {
  const spy: EnumerationSpy = {
    ownKeysCalls: 0,
    getOwnPropertyDescriptorCalls: 0,
    hasCalls: 0
  };

  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      return Reflect.get(obj, prop, receiver);
    },
    ownKeys(obj) {
      spy.ownKeysCalls += 1;
      return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj, prop) {
      spy.getOwnPropertyDescriptorCalls += 1;
      return Reflect.getOwnPropertyDescriptor(obj, prop);
    },
    has(obj, prop) {
      spy.hasCalls += 1;
      return Reflect.has(obj, prop);
    }
  });

  return { proxy, spy };
}
