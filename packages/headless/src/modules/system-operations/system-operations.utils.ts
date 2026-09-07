import { nanoid } from "nanoid";
import { useSessionStorage } from "../../utils/useStorage";
import type { StoredOperation } from "./system-operations.types";
// -----------------------------------------------------------------------------
/**
 * @module system-operations/system-operations.utils
 * @description SessionStorage persistence and oid generation for the operation
 * registry.
 */

const STORAGE_KEY = "upmind:operations";
const OID_LENGTH = 10;

/**
 * Read the stored operation map from this tab's sessionStorage. Returns an
 * empty map when storage is unavailable (SSR) or empty, so importing this
 * module server-side never touches `sessionStorage`.
 */
export function readOperations(): Record<string, StoredOperation> {
  if (typeof sessionStorage === "undefined") return {};
  return useSessionStorage().get(STORAGE_KEY) ?? {};
}

/** Persist the operation map to this tab's sessionStorage. */
export function writeOperations(
  operations: Record<string, StoredOperation>
): void {
  useSessionStorage().set(STORAGE_KEY, operations);
}

/**
 * Generate a 10-character URL-safe operation id from the nanoid alphabet
 * (`[A-Za-z0-9_-]`).
 */
export function generateOid(): string {
  return nanoid(OID_LENGTH);
}
