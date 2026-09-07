/**
 * @graphify-citation `graphify query "StoredOperation OperationState Handler
 * operation registry type"` and `graphify query "PendingOperation
 * OperationNotFoundError HandlerNotFoundError payment operation type"`
 * (2026-09-01, `graphify-out/graph.json`; BFS depth=2). The only pre-existing
 * operation construct in the graph is the payment-scoped legacy registry —
 * `PendingOperation` (`payment-details.types.ts` L34) and `clearOperation()`
 * (`payment-details.utils.ts` L521). No generic `StoredOperation`,
 * `OperationState`, `Handler`, or any of the five operation error classes
 * exists anywhere. This module generalises that payment-scoped registry (see
 * `payment-details.utils.ts:504-533`) rather than duplicating a live
 * construct, so minting these here is warranted. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module system-operations/system-operations.types
 * @description Types for the generic return-path operation registry — the
 * stored operation shape, the reactive store state, the handler contract, and
 * the five typed error classes.
 */

export type StoredOperation = {
  key: string;
  payload: unknown;
  createdAt: number;
};

export type OperationState = {
  operations: Record<string, StoredOperation>;
  currentOid: string | null;
  isExecuting: boolean;
  lastResult: unknown;
  lastError: Error | null;
};

export type Handler = (payload: unknown) => Promise<unknown>;

export type IsReadyOptions = {
  timeout?: number;
};

// -----------------------------------------------------------------------------
