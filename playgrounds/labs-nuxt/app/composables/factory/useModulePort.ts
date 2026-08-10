// -----------------------------------------------------------------------------
/**
 * @module factory/useModulePort
 * @description THE port call site — one generic function over every scenario
 * key. A module reaches the factory by declaring a registry entry and
 * nothing else: which composable to boot, which scope to boot it at, and
 * whether it owns table state are the entry's data, derived or declared, never
 * a per-module file. There is deliberately no `use<Module>Port.ts`.
 *
 * It is also the ONE site holding the raw cell, so it is the only place the
 * module's own `useInternals()` is reachable — which is why the debug chain
 * (schema → uischema → model → the wire the criteria BUILDS) is assembled
 * here. The wire is BUILT, never read off a recorded request: producing it
 * fires nothing, so it is populated before the first fetch.
 */

import { useCompositionPort } from "./useCompositionPort";
import { useTableChannel } from "./useTableChannel";
import {
  get,
  isArray,
  isEmpty,
  isFunction,
  isNil,
  join,
  map,
  omitBy,
  toString
} from "lodash-es";
import type { ScenarioBinding, ScenarioScopedCell } from "./registry.types";
import type {
  ModulePort,
  ModulePortCriteria,
  ModulePortDebug,
  ModulePortScope
} from "./useModulePort.types";
import type { TableChannelCell } from "./useTableChannel.types";
import type { QueryProps } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * True when the cell publishes the query criteria a controlled table channel
 * reads. Whether a scenario owns table state is DERIVED, never declared: the
 * cell publishes criteria or it does not.
 */
export function ownsQueryState(cell: ScenarioScopedCell): boolean {
  const context = cell.useContext();
  return !!get(context, "query") && !!get(context, ["schemas", "query"]);
}

/**
 * The translated wire as SEARCH PARAMS — the tuple (or tuples) joined into
 * `order`, the cursor as `limit`/`offset`, and the `filter[column|operator]`
 * keys `translateQuery` already emits, with the inactive ones dropped.
 *
 * It mirrors rather than calls `useQuery`'s own serialisation: that lives inline
 * in `request()`, which writes onto a live `URL` and then FETCHES, and the debug
 * chain must be producible without firing anything. Deleting this copy means
 * exporting a pure serialiser from the query module.
 */
function toRequestParams(props: QueryProps): Record<string, string> {
  const sort = props.sort ?? [];

  return omitBy(
    {
      ...props.filters,
      order: isArray(sort[0])
        ? join(
            map(sort as string[][], entry => join(entry, "")),
            ","
          )
        : join(sort as string[], ""),
      limit: toString(get(props, ["pagination", "limit"])),
      offset: toString(get(props, ["pagination", "offset"]))
    },
    isEmpty
  ) as Record<string, string>;
}

/** The four artefacts shown side by side; absent for a cell that owns no criteria. */
function readDebug(cell: ScenarioScopedCell): ModulePortDebug | undefined {
  if (!ownsQueryState(cell)) return undefined;

  const context = cell.useContext();
  const translate = get(cell.useInternals?.() ?? {}, "translateQuery");

  return {
    schema: get(context, ["schemas", "query", "schema"]),
    uischema: get(context, ["schemas", "query", "uischema"]),
    model: get(context, ["query", "value"]),
    request: isFunction(translate)
      ? toRequestParams(translate() as QueryProps)
      : {}
  };
}

/** The cell's own request state, relayed; absent for a cell that owns no criteria. */
function readCriteria(
  cell: ScenarioScopedCell
): ModulePortCriteria | undefined {
  if (!ownsQueryState(cell)) return undefined;

  const context = cell.useContext();
  const set = get(cell.useInternals?.() ?? {}, ["query", "setCriteria"]);
  if (!isFunction(set)) return undefined;

  return {
    schema: get(context, ["schemas", "query", "schema"]),
    uischema: get(context, ["schemas", "query", "uischema"]),
    model: get(context, "query") as ComputedRef<Record<string, unknown>>,
    set: set as ModulePortCriteria["set"]
  };
}

// -----------------------------------------------------------------------------

/**
 * Boots one registry entry into its seam port.
 *
 * @param entry The binding, from the scenario contract (`registry.ts`).
 * @param scope Overrides — the actor a feature or a route named, and the
 * context id a handoff supplies. Absent, the binding's own scope is used.
 */
export function useModulePort(
  entry: ScenarioBinding,
  scope: ModulePortScope = {}
): ModulePort {
  const scoped = entry.useList().as(scope.actor ?? entry.scope.actor);
  const cell =
    entry.scope.contextType && !isNil(scope.contextId) && isFunction(scoped.for)
      ? scoped.for(entry.scope.contextType, scope.contextId)
      : scoped;

  // `LiveContext` is deliberately opaque (`Record<string, unknown>`), so the
  // channel's structural cell shape is asserted once, here, behind the
  // `ownsQueryState` guard that just proved the members exist.
  const port = useCompositionPort(cell, {
    table: ownsQueryState(cell)
      ? useTableChannel(cell as unknown as TableChannelCell)
      : undefined
  });

  return {
    get actions() {
      return port.actions;
    },
    criteria: readCriteria(cell),
    getMeta: port.getMeta,
    snapshot: () => ({ ...port.snapshot(), debug: readDebug(cell) }),
    table: port.table
  };
}
