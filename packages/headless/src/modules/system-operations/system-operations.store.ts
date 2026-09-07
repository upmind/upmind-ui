import { Store } from "@tanstack/vue-store";
import { ref } from "vue";
import { readOperations } from "./system-operations.utils";
import type { OperationState } from "./system-operations.types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module system-operations/system-operations.store
 * @description Operation registry singleton store.
 *
 * WARNING: Do not import directly. Use via the useOperations composable only.
 */

/**
 * Module-level singleton store, hydrated from this tab's sessionStorage so a
 * page refresh (a fresh module evaluation) rebuilds the pending operations.
 * @internal
 */
export const operationsStore = new Store<OperationState>({
  operations: readOperations(),
  currentOid: null,
  isExecuting: false,
  lastResult: undefined,
  lastError: null
});

/**
 * Reactivity bridge: Vue computed refs need a reactive dependency to
 * re-evaluate. TanStack Store is not Vue-reactive, so a tick counter is the
 * signal — computeds touch `storeTick`, then read `operationsStore.state`
 * directly, keeping the store the single source of truth.
 * @internal
 */
export const storeTick = ref(0);

operationsStore.subscribe(() => {
  storeTick.value++;
});

/**
 * The single write gate for the operation store — partial-merges a patch onto
 * the current state.
 * @internal
 */
export function updateState(patch: Partial<OperationState>): void {
  operationsStore.setState(state => ({ ...state, ...patch }));
}
