/**
 * Controlled-table channel types (design §3). TYPE only — zero table
 * dependency; the library choice is FE-2977's.
 */
export interface TableModel {
  filter: Record<string, unknown>; // model for the filters schema (ADR-027 Am.4)
  sort: ReadonlyArray<{ field: string; dir: "asc" | "desc" }>;
  pagination: { page: number; perPage: number; total?: number };
}

export type TableIntent =
  | { type: "filter"; model: TableModel["filter"] }
  | { type: "sort"; sort: TableModel["sort"] }
  | { type: "paginate"; page: number; perPage?: number };

/** Renderer emits intent up; the composable owns and applies it (ADR-027 Am.3). */
export interface ControlledTableChannel {
  read(): TableModel; // consume-down: composable-owned state
  emit(intent: TableIntent): void; // emit-up: user intent; the composable applies it
}
