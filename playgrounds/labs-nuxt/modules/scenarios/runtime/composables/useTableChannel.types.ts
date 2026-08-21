/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `DeclaringTableChannel` / `TableChannelCell` node exists in the tree; these
 * are RELOCATED from `useTableChannel.ts`, not minted. `ControlledTableChannel`
 * and `TableModel` in `@upmind-automation/scenario-harness` and `PaginationInfo`
 * in `@upmind-automation/headless` are the shapes they build on, consumed rather
 * than restated. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useTableChannel.types
 * @description The controlled-table channel's own shapes — the harness channel
 * widened by the columns a query schema declares steerable, plus the minimal
 * live-cell surface the channel reads.
 */

import type { PaginationInfo } from "@upmind-automation/headless";
import type {
  ControlledTableChannel,
  TableModel
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * One field the query schema declares ORDERABLE, carrying the module's sort-label
 * channel. The vocabulary is the schema's: the collection's whole ordering
 * vocabulary is its own `sort` enum and no declaration restates it (`R6-28`).
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-12) — no sort-option
 * node exists in the tree; the field is `client-email.schemas.ts`'s own
 * `sort.items.properties.field` member, which is what `order=` spells on the
 * wire.
 */
export type DeclaredSortField = {
  field: string;
  /**
   * The module's sort-uischema `i18n` key PREFIX — the SAME value for every
   * field of a module, never a per-field title. The option key is
   * `<i18n>.<field>`, composed at render time by `@jsonforms/core`'s own
   * `enumToEnumOptionMapper`.
   */
  i18n?: string;
};

/**
 * The channel plus what the query schema DECLARES steerable. A renderer that
 * offers a control the schema never declared offers one that cannot work: the
 * intent reaches the criteria, ajv refuses it, and the list draws a failure for
 * a header the user was invited to click. `ControlledTableChannel` is the
 * harness's frozen seam shape, so the declaration rides alongside it rather
 * than inside `TableModel`.
 *
 * Optional on purpose: a channel that cannot declare leaves every column live,
 * which is where a module with no query schema already stands.
 */
export type DeclaringTableChannel = ControlledTableChannel & {
  declared?(): { sort: DeclaredSortField[]; filter: string[] };
};

/**
 * The minimal live-cell surface the channel reads — structural, so the channel
 * stays module-agnostic. The composable's filter model is NESTED (column →
 * operator → value) where the harness `TableModel.filter` is FLAT; `sortBy`
 * takes the harness sort shape, so a drift between it and the composable's own
 * sort model reds where the real cell is bound to this type.
 */
export type TableChannelCell = {
  useContext(): {
    query: {
      value: {
        filters?: Record<string, Record<string, unknown>>;
        sort?: TableModel["sort"];
      };
    };
    /**
     * `sortUischema` is optional: a module declaring none leaves every option
     * falling back to its wire name rather than going missing.
     */
    schemas: { query: { schema: unknown; sortUischema?: unknown } };
    pagination: { value: Partial<PaginationInfo> };
  };
  useActions(): {
    filterBy(model: Record<string, Record<string, unknown>>): void;
    sortBy(sort: TableModel["sort"]): void;
    nextPage(): void;
    prevPage(): void;
  };
};
