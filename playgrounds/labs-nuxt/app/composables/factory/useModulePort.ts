// -----------------------------------------------------------------------------
/**
 * @module factory/useModulePort
 * @description THE port call site — one generic function over every scenario
 * key (W-D31). A module reaches the factory by declaring a registry entry and
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
  ModulePortDebug,
  ModulePortScope
} from "./useModulePort.types";
import type { TableChannelCell } from "./useTableChannel";
import type { QueryProps } from "@upmind-automation/headless";

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
 * The translated wire as SEARCH PARAMS, mirroring the serialisation
 * `useQuery`'s `request()` performs (`useQuery.ts:154-176`) — the tuple (or
 * tuples) joined into `order`, the cursor as `limit`/`offset`, and the
 * `filter[column|operator]` keys `translateQuery` already emits, with the
 * inactive ones dropped exactly as the request drops them.
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

/** The four artefacts W-D34 shows side by side; absent for a cell that owns no criteria. */
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
    getMeta: port.getMeta,
    snapshot: () => ({ ...port.snapshot(), debug: readDebug(cell) }),
    table: port.table
  };
}
