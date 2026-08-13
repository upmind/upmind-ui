// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useModulePort
 * @description THE port call site — one generic function over every scenario
 * key. A module reaches the factory by declaring the composable and nothing
 * else: WHERE it boots is the url's (self with no context until a segment says
 * otherwise), and whether it owns table state is derived from the cell itself,
 * never a per-module file. There is deliberately no `use<Module>Port.ts`.
 *
 * It is also the ONE site holding the raw cell, so it is the only place the
 * module's own `useInternals()` is reachable — which is why the debug chain
 * (schema → uischema → model → the wire the criteria BUILDS) is assembled
 * here. The wire is BUILT, never read off a recorded request: producing it
 * fires nothing, so it is populated before the first fetch.
 */

import { ScopeActorTypes } from "@upmind-automation/headless";
import { servesActor } from "../../../../app/composables/scope";
import { useCompositionPort } from "./useCompositionPort";
import { useTableChannel } from "./useTableChannel";
import {
  get,
  isArray,
  isEmpty,
  isFunction,
  join,
  map,
  omitBy,
  toString
} from "lodash-es";
import type {
  FourLayerComposable,
  ScenarioScopedCell
} from "../scenario.types";
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
 * What a scope the module does not serve publishes — the PORT's own flag, since
 * there is no cell to ask (`MODULE_STATE_META_FLAG.SERVED`). `getMeta` and
 * `snapshot().meta` share this one object, which is the port's own
 * no-divergence contract.
 */
const UNSERVED_META = { isServed: false };

// -----------------------------------------------------------------------------

/**
 * Boots one scoped composable into its seam port.
 *
 * @param composable The builder a declaration names — its collection or its
 * editor, whichever the caller is opening.
 * @param scope WHERE it boots: the actor and the context the url named, and
 * whether the instance is a fresh one. Absent, it boots as SELF with no
 * context, which no declaration may override (`R6-30b`).
 */
export function useModulePort(
  composable: FourLayerComposable,
  scope: ModulePortScope = {}
): ModulePort {
  const actor = scope.actor ?? ScopeActorTypes.SELF;

  // An actor the module's own matrix marks `never` gets NO cell (`R7-14`): the
  // module resolves its request target from the ACTIVE SESSION, not from the
  // url, so a cell booted at a refused scope answers the previous actor's
  // identity and re-serves that actor's records under a url saying otherwise.
  if (!servesActor(composable.scopeMatrix, actor))
    return {
      actions: {},
      getMeta: () => UNSERVED_META,
      scopeMatrix: composable.scopeMatrix,
      snapshot: () => ({ actions: [], context: {}, meta: UNSERVED_META })
    };

  const scoped = composable().as(actor);

  // A fresh instance addresses no record, so it takes neither `.for()` nor the
  // registry's cached cell: the two steps are alternatives, never a sequence.
  const cell = scope.fresh
    ? isFunction(scoped.fresh)
      ? scoped.fresh()
      : scoped
    : scope.context && isFunction(scoped.for)
      ? scoped.for(scope.context.type, scope.context.id)
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
    // The matrix is the COMPOSABLE's own, read off the reference the
    // declaration named — never re-declared beside it, and never a member a
    // module has to remember to publish on its context (`R6-31`).
    scopeMatrix: composable.scopeMatrix,
    snapshot: () => ({ ...port.snapshot(), debug: readDebug(cell) }),
    table: port.table
  };
}
