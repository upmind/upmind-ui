/**
 * Controlled-table channel types. TYPE only — zero table dependency; the
 * library choice stays the consumer's.
 *
 * `graphify-out/graph.json` carries this file
 * (`packages_scenario_harness_src_port_table_channel_types_ts`) and
 * `packages/headless/src/modules/query/query.types.ts` as the only two homes
 * of a sort-direction vocabulary; there is no shared node to reuse, so the
 * members below are minted here — the seam's own source — rather than
 * mirrored consumer-side.
 */

/**
 * A sort entry's direction. A derived union rather than an `enum`, for
 * {@link SCOPE_ACTOR}'s reason: headless declares its own NOMINAL
 * `SortDirection` over these same two wire values and the core cannot import
 * it (the no-vue lint boundary), so only a literal union stays assignable
 * across the seam in both directions.
 */
export const SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc"
} as const;

export type SortDirection =
  (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

export type TableModel = {
  filter: Record<string, unknown>; // model for the filters schema (ADR-027 Am.4)
  sort: ReadonlyArray<{ field: string; dir: SortDirection }>;
  pagination: { page: number; perPage: number; total?: number };
};

/** One {@link TableIntent}'s discriminator. */
export const TABLE_INTENT_TYPE = {
  FILTER: "filter",
  SORT: "sort",
  PAGINATE: "paginate"
} as const;

export type TableIntentType =
  (typeof TABLE_INTENT_TYPE)[keyof typeof TABLE_INTENT_TYPE];

export type TableIntent =
  | { type: typeof TABLE_INTENT_TYPE.FILTER; model: TableModel["filter"] }
  | { type: typeof TABLE_INTENT_TYPE.SORT; sort: TableModel["sort"] }
  | {
      type: typeof TABLE_INTENT_TYPE.PAGINATE;
      page: number;
      perPage?: number;
    };

/** Renderer emits intent up; the composable owns and applies it (ADR-027 Am.3). */
export type ControlledTableChannel = {
  read(): TableModel; // consume-down: composable-owned state
  emit(intent: TableIntent): void; // emit-up: user intent; the composable applies it
};
