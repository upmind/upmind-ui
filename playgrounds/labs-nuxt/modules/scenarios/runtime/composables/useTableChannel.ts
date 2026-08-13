// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useTableChannel
 * @description Builds a `ControlledTableChannel` over a live 4-layer LIST cell
 * that owns query state — its one model. `read()` reflects the composable's
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
 * (a renderer concern), not here.
 */

import { TABLE_INTENT_TYPE } from "@upmind-automation/scenario-harness";
import { find, forEach, get, isNil, keys, map } from "lodash-es";
import type {
  DeclaredSortField,
  DeclaringTableChannel,
  TableChannelCell
} from "./useTableChannel.types";
import type {
  TableIntent,
  TableModel
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The intent discriminator's members under the labs spelling. Their one home is
 * the seam that declares the union — `port/table-channel.types.ts` in
 * `@upmind-automation/scenario-harness`, where FE-3071 minted them — so this is
 * an alias to that object, never a consumer-side copy of its values.
 */
export const TableIntentTypes = TABLE_INTENT_TYPE;

/** The single declared operator for a wire column, read from the query schema. */
function operatorFor(schema: unknown, column: string): string | undefined {
  return keys(
    get(schema, ["properties", "filters", "properties", column, "properties"])
  )[0];
}

/**
 * Every field the schema declares ORDERABLE, under its own title. A Draft-07
 * schema restricts the member either as a bare `enum` or as `oneOf` `const`
 * entries — the same two forms `translateQuery`'s own wire gate reads, so the
 * control can never offer a field the translator would drop — and only the
 * second can TITLE each member, which is where an option's label comes from
 * (`R6-28`). A field titled neither there nor on the filter column of that name
 * is offered under its wire name rather than dropped, so an untitled column is
 * visible instead of silently unorderable.
 *
 * The rule is spelt here rather than imported from the query platform: this file
 * is loaded by node-environment specs, and a VALUE import off the headless
 * barrel drags the whole package's module-scope browser globals in with it.
 */
function declaredSort(schema: unknown): DeclaredSortField[] {
  const field = get(schema, [
    "properties",
    "sort",
    "items",
    "properties",
    "field"
  ]);

  const titled: unknown[] = get(field, "oneOf") ?? [];

  return map(
    get(field, "enum") ?? map(titled, "const"),
    (name: string): DeclaredSortField => ({
      field: name,
      i18n:
        get(find(titled, ["const", name]), "title") ??
        get(schema, ["properties", "filters", "properties", name, "title"])
    })
  );
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
export function useTableChannel(cell: TableChannelCell): DeclaringTableChannel {
  const context = cell.useContext();
  const actions = cell.useActions();
  const schema = context.schemas.query.schema;

  return {
    declared() {
      return {
        sort: declaredSort(schema),
        filter: keys(get(schema, ["properties", "filters", "properties"]))
      };
    },

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
      if (intent.type === TABLE_INTENT_TYPE.FILTER) {
        actions.filterBy(liftFilters(intent.model, schema));
        return;
      }

      if (intent.type === TABLE_INTENT_TYPE.SORT) {
        actions.sortBy([...intent.sort]);
        return;
      }

      // paginate — the composable exposes only ±1 steppers; a jump-to-page and a
      // live page-size are named gaps in `useQuery`, filed.
      const current = context.pagination.value.page ?? 1;
      if (intent.page > current) actions.nextPage();
      else if (intent.page < current) actions.prevPage();
    }
  };
}
