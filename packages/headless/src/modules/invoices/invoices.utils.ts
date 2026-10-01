import {
  INVOICES_CONTEXT_WIRE_PARAMS,
  InvoicesContextTypes
} from "./invoices.types";
import { get } from "lodash-es";
import type { ScopeContext } from "../scope";

/** The static request param a relationship `.for()` context adds to every read; none for a client or no context. */
export function scopeWireParams(
  scopeContext?: ScopeContext
): Record<string, string> {
  const param = get(INVOICES_CONTEXT_WIRE_PARAMS, scopeContext?.type ?? "");
  return param && scopeContext?.id ? { [param]: scopeContext.id } : {};
}

/**
 * The `client_id` a gated probe (`hasUnpaid` / `consolidatableCount`) filters
 * by. An identity scope (self, or `.for('client', id)`) scopes the count to
 * that client. A relationship narrow carries its own filter through
 * `scopeWireParams`, so the probe adds NO `client_id` — a session `client_id`
 * there re-widens a retargeted reading (FE-2824), exactly as the list read
 * omits it.
 */
export function probeClientFilter(
  scopeContext: ScopeContext | undefined,
  clientId: string | undefined
): Record<string, string> {
  const isIdentityScope =
    !scopeContext || scopeContext.type === InvoicesContextTypes.CLIENT;
  return isIdentityScope && clientId ? { client_id: clientId } : {};
}

// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.utils
 * @description AC A's browser save-as trigger for a downloaded PDF blob —
 * the anchor-click pattern the `download` attribute needs
 * (`oracle: helpers/file.ts`'s `downloadBlob`). Mirrors `payment.utils.ts`'s
 * `submitViaForm` (create -> append -> trigger -> remove).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
