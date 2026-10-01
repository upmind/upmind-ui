import { computed } from "vue";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils/useError";
import { useI18n } from "../system-localisation/useI18n";
import {
  operationsStore,
  storeTick,
  updateState
} from "./system-operations.store";
import { generateOid, writeOperations } from "./system-operations.utils";
import { forEach, omit, values } from "lodash-es";
import type {
  Handler,
  IsReadyOptions,
  StoredOperation
} from "./system-operations.types";
// -----------------------------------------------------------------------------
/**
 * @module system-operations/useOperations
 * @description Generic return-path operation registry. Modules register a
 * handler by key; a funnel guard dispatches a stored operation by its `?oid=`
 * after an off-site redirect returns to the same tab.
 */

const handlers = new Map<string, Handler>();
const waiters = new Map<string, Array<(ok: boolean) => void>>();

const READY_TIMEOUT_MS = 5000;

/**
 * Register a handler for a key. Warns and replaces on a duplicate key, and
 * releases any consumer awaiting `isReady` for that key.
 */
function register<TPayload, TResult>(
  key: string,
  handler: (payload: TPayload) => Promise<TResult>
): void {
  if (handlers.has(key))
    console.warn(`[operations] Handler '${key}' already registered, replacing`);
  handlers.set(key, handler as Handler);

  const pending = waiters.get(key);
  if (pending) {
    waiters.delete(key);
    forEach(pending, resolve => resolve(true));
  }
}

/**
 * Resolve `true` once a handler for `key` is registered — immediately if
 * already present, otherwise on registration, or to the current presence after
 * `opts.timeout` (default 5000ms).
 */
function isReady(key: string, opts?: IsReadyOptions): Promise<boolean> {
  if (handlers.has(key)) return Promise.resolve(true);

  return new Promise<boolean>(resolve => {
    const queue = waiters.get(key) ?? [];
    queue.push(resolve);
    waiters.set(key, queue);

    setTimeout(
      () => resolve(handlers.has(key)),
      opts?.timeout ?? READY_TIMEOUT_MS
    );
  });
}

/** Return the stored operation for an oid, or `null`. */
function getOperation(oid: string): StoredOperation | null {
  return operationsStore.state.operations[oid] ?? null;
}

/**
 * Validate a payload, store it under a fresh oid, persist to sessionStorage,
 * and return the oid.
 *
 */
function createOperation<T>(key: string, payload: T): string {
  const oid = generateOid();
  const operation: StoredOperation = { key, payload, createdAt: Date.now() };
  const next = { ...operationsStore.state.operations, [oid]: operation };

  writeOperations(next);
  updateState({ operations: next });

  return oid;
}

/** Remove one operation by oid and persist. */
function clearOperation(oid: string): void {
  const next = omit(operationsStore.state.operations, oid);
  writeOperations(next);
  updateState({ operations: next });
}

/**
 * Dispatch a stored operation: await handler readiness, invoke it with the
 * stored payload, and remove the operation once it settles.
 *
 */
async function executeOperation<T>(oid: string): Promise<T> {
  const operation = getOperation(oid);
  const { t } = useI18n();

  if (!operation)
    throw new DetailedError(
      t("error.operation_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  if (operationsStore.state.isExecuting)
    throw new DetailedError(
      t("error.operation_busy"),
      responseCodes.Conflict,
      ErrorOrigin.Headless
    );

  // Claim the single execution slot synchronously, before the first await, so a
  // concurrent call cannot pass the busy check during the isReady microtask.
  updateState({ currentOid: oid, isExecuting: true });

  return isReady(operation.key)
    .then(ready => {
      if (!ready)
        throw new DetailedError(
          t("error.operation_handler_not_found"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );

      const handler = handlers.get(operation.key)!;
      return handler(operation.payload);
    })
    .then(result => {
      updateState({ lastResult: result, lastError: null });
      return result as T;
    })
    .catch(error => {
      updateState({ lastError: error as Error });
      throw error;
    })
    .finally(() => {
      clearOperation(oid);
      updateState({ currentOid: null, isExecuting: false });
    });
}

export function useOperations() {
  const pendingOperations = computed<StoredOperation[]>(() => {
    void storeTick.value;
    return values(operationsStore.state.operations);
  });

  const currentOid = computed(() => {
    void storeTick.value;
    return operationsStore.state.currentOid;
  });

  const isExecuting = computed(() => {
    void storeTick.value;
    return operationsStore.state.isExecuting;
  });

  const lastResult = computed(() => {
    void storeTick.value;
    return operationsStore.state.lastResult;
  });

  const lastError = computed(() => {
    void storeTick.value;
    return operationsStore.state.lastError;
  });

  // -----------------------------------------------------------------------------

  return {
    // --- lifecycle
    clearOperation,
    createOperation,
    executeOperation,
    getOperation,
    // --- registration
    isReady,
    register,
    // --- reactive state
    currentOid,
    isExecuting,
    lastError,
    lastResult,
    pendingOperations
  };
}

export type UseOperations = ReturnType<typeof useOperations>;
