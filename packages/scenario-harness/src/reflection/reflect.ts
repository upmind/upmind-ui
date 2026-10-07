import { classify } from "../archetype/archetype";
import { isArray, isObject, isPlainObject, transform } from "lodash-es";
import type { ReflectedSnapshot } from "./reflection.types";
import type { ModuleDescriptor } from "../archetype/archetype.types";
import type { CompositionPort } from "../port/port.types";
import type { ScopeActor } from "../world/scope-actor";
// -----------------------------------------------------------------------------
/**
 * @module reflection/reflect
 * @description Reflects a booted composable cell into a plain, point-in-time
 * module descriptor, classified by archetype.
 */

/**
 * True only for a genuine CYCLE — a reference that is an ANCESTOR of the node
 * being walked, i.e. already on the current descent path.
 *
 * @decision guard the descent PATH, never every reference ever seen.
 * what:    `ancestors` holds only the containers between the root and the
 *          current node. A container is added before its children are walked
 *          and removed after, so two SIBLING positions holding the same
 *          reference are each walked in full.
 * why:     a cycle and an ALIAS are different things, and only the cycle is
 *          dangerous. A four-layer context legitimately publishes the same
 *          object twice — `useBillingSettingsManager`'s context layer exposes
 *          the whole machine context as `context` AND its `model` / `baseModel`
 *          / `schema` / `uischema` members as siblings, the same references at
 *          two depths (`usePersonalDetailsManager` and every other
 *          `dataManagerMachine`-backed module do the same). An ever-seen guard
 *          walks `context` first, marks those four, and then DROPS every
 *          sibling — so `snapshot.context.schema` and `.model` come back
 *          `undefined`, `classify` reads `hasRealSchema: false` /
 *          `hasModel: false`, and a Form-Flow module silently renders as
 *          Action-panel with no form at all.
 * rejected: (1) reordering the module's own context members so `context` comes
 *          last — it only moves which alias is lost, and it makes every
 *          module's key order load-bearing. (2) dropping the `context` member
 *          from the composables — it is part of the four-layer contract and
 *          consumers read it.
 *
 * Still stack-safe: a self-referential graph terminates, because the repeat
 * IS an ancestor. An aliased DAG is emitted once per position, which is what
 * a point-in-time snapshot means.
 */
function isCycle(entry: unknown, ancestors: WeakSet<object>): boolean {
  return isObject(entry) && ancestors.has(entry);
}

function omitFromArray(
  value: readonly unknown[],
  ancestors: WeakSet<object>
): unknown[] {
  const out: unknown[] = [];
  for (const entry of value) {
    if (entry === undefined || isCycle(entry, ancestors)) continue;
    out.push(deepOmitUndefined(entry, ancestors));
  }
  return out;
}

function omitFromRecord(
  value: Record<string, unknown>,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  return transform(
    value,
    (acc: Record<string, unknown>, entry, key) => {
      if (entry === undefined || isCycle(entry, ancestors)) return;
      // `Object.defineProperty`, never `acc[key] = …`: an own
      // `__proto__` key in `value` becomes a normal own data property on
      // `acc` instead of tripping `Object.prototype`'s `__proto__`
      // setter and replacing `acc`'s own prototype.
      Object.defineProperty(acc, key, {
        value: deepOmitUndefined(entry, ancestors),
        enumerable: true,
        writable: true,
        configurable: true
      });
    },
    {}
  );
}

function omitFromContainer(
  container: unknown[] | Record<string, unknown>,
  ancestors: WeakSet<object>
): unknown[] | Record<string, unknown> {
  ancestors.add(container);

  let result: unknown[] | Record<string, unknown>;
  if (isArray(container)) {
    result = omitFromArray(container, ancestors);
  } else {
    result = omitFromRecord(container, ancestors);
  }

  // Ascend: this container is no longer on the path, so a SIBLING holding the
  // same reference is an alias, not a cycle, and is walked in full.
  ancestors.delete(container);

  return result;
}

function deepOmitUndefined<T>(value: T, ancestors?: WeakSet<object>): T;
function deepOmitUndefined(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet()
): unknown {
  if (isArray(value)) return omitFromContainer(value, ancestors);
  if (!isPlainObject(value)) return value;

  return omitFromContainer(value as Record<string, unknown>, ancestors);
}

/**
 * Reflects one already-booted composable cell into a point-in-time
 * {@link ModuleDescriptor}. Pure and stateless: pulls exactly one fresh
 * `port.snapshot()` per call and never caches across calls, so a
 * hot-reloaded or async-mutated composable is reflected correctly on the
 * next pull. Never enumerates `port` itself — only its named `snapshot`/
 * `table` members are read, so a builder-alike port is never
 * side-effectfully instantiated. Omits undefined-valued entries from
 * `context`/`meta` at every depth, including array elements (never a `null`
 * hole); `actions` is copied, never aliased to the port's own array; other
 * non-JSON values are the adapter's responsibility.
 */
export function reflect<K extends string>(
  key: K,
  actor: ScopeActor,
  port: CompositionPort
): ModuleDescriptor<K> {
  const raw = port.snapshot();
  const snapshot: ReflectedSnapshot = {
    actions: [...raw.actions],
    context: deepOmitUndefined(raw.context),
    meta: deepOmitUndefined(raw.meta)
  };
  const archetype = classify(snapshot, port.table !== undefined);

  return { key, actor, archetype, snapshot };
}
