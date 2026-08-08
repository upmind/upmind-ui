// -----------------------------------------------------------------------------
/**
 * @module factory/useTableChannel
 * @description Builds a `ControlledTableChannel` over a live 4-layer LIST cell
 * that owns query state (S-D9's one model). `read()` reflects the composable's
 * filter/sort/pagination DOWN to the renderer; `emit()` lifts a table intent UP
 * through the composable's own `filterBy`/`sortBy`/paging actions, which own and
 * apply it (ADR-027 Am.3). Adapter-side because `packages/headless` has no
 * `@upmind-automation/scenario-harness` dependency and adding that edge would
 * invert the dependency direction — so the channel names the harness types here.
 *
 * The composable's filter model is NESTED (column → operator → value) while the
 * harness `TableModel.filter` is FLAT; this bridge lifts and flattens between
 * them, sourcing the operator per column from the query schema. Client-emails
 * declares one operator per column, so the flat value maps unambiguously; a
 * multi-operator column is disambiguated by the column uischema's `filterScope`
 * (a §4/renderer concern), not here.
 */

import { forEach, get, isNil, keys } from "lodash-es";
import type {
  ControlledTableChannel,
  TableIntent,
  TableModel
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The `TableIntent` discriminators as members, so no comparison below spells a
 * raw string. Their real home is the harness's own `table-channel.types.ts`,
 * where `TableIntent` is declared as a bare string-literal union with nothing
 * keying it; `packages/scenario-harness` is outside this story's write set, so
 * the members are mirrored here — `satisfies` reds if the union ever moves —
 * and the enum lands at the source with FE-3071.
 */
export const TableIntentTypes = {
  FILTER: "filter",
  SORT: "sort",
  PAGINATE: "paginate"
} as const satisfies Record<string, TableIntent["type"]>;

/** One sort entry — the harness-frozen shape (`TableModel["sort"]` member). */
type SortEntry = TableModel["sort"][number];

/** The nested query model the cell publishes on `useContext().query`. */
type NestedQueryModel = {
  filters?: Record<string, Record<string, unknown>>;
  sort?: SortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * The minimal live-cell surface the channel reads — structural, so the channel
 * stays module-agnostic. `sortBy` takes the harness sort shape, so a drift
 * between it and the composable's own `SortModel` reds where the real cell is
 * bound to this type (the compile-time bridge design §2.3 names).
 */
export interface TableChannelCell {
  useContext(): {
    query: { value: NestedQueryModel };
    schemas: { query: { schema: unknown } };
    pagination: { value: { page?: number; limit?: number; total?: number } };
  };
  useActions(): {
    filterBy(model: Record<string, Record<string, unknown>>): void;
    sortBy(sort: SortEntry[]): void;
    nextPage(): void;
    prevPage(): void;
  };
}

// -----------------------------------------------------------------------------

/** The single declared operator for a wire column, read from the query schema. */
function operatorFor(schema: unknown, column: string): string | undefined {
  return keys(
    get(schema, ["properties", "filters", "properties", column, "properties"])
  )[0];
}

/** Nested `{ col: { op: v } }` → flat `{ col: v }` for the renderer. */
function flattenFilters(
  nested: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  forEach(nested, (operators, column) => {
    const operator = keys(operators)[0];
    if (!isNil(operator)) flat[column] = operators[operator];
  });
  return flat;
}

/** Flat `{ col: v }` → nested `{ col: { op: v } }`, `op` from the schema. */
function liftFilters(
  flat: Record<string, unknown>,
  schema: unknown
): Record<string, Record<string, unknown>> {
  const nested: Record<string, Record<string, unknown>> = {};
  forEach(flat, (value, column) => {
    const operator = operatorFor(schema, column);
    if (!isNil(operator)) nested[column] = { [operator]: value };
  });
  return nested;
}

/**
 * Builds the controlled-table channel for a query-owning list cell. The context
 * and actions are resolved ONCE — `query`/`pagination` are computeds that stay
 * reactive, and the actions instance is minted once per scope.
 */
export function useTableChannel(
  cell: TableChannelCell
): ControlledTableChannel {
  const context = cell.useContext();
  const actions = cell.useActions();
  const schema = context.schemas.query.schema;

  return {
    read(): TableModel {
      const model = context.query.value;
      const page = context.pagination.value;
      return {
        filter: flattenFilters(model.filters ?? {}),
        sort: [...(model.sort ?? [])],
        pagination: {
          page: page.page ?? 1,
          perPage: page.limit ?? 0,
          total: page.total
        }
      };
    },

    emit(intent: TableIntent): void {
      if (intent.type === TableIntentTypes.FILTER) {
        actions.filterBy(liftFilters(intent.model, schema));
        return;
      }

      if (intent.type === TableIntentTypes.SORT) {
        actions.sortBy([...intent.sort]);
        return;
      }

      // paginate — the composable exposes only ±1 steppers; a jump-to-page and a
      // live page-size are named gaps in `useQuery` (§4.4b), filed.
      const current = context.pagination.value.page ?? 1;
      if (intent.page > current) actions.nextPage();
      else if (intent.page < current) actions.prevPage();
    }
  };
}
