import { unref, watch } from "vue";
import {
  InvoicesContextTypes,
  INVOICES_CONTEXT_WIRE_KEYS
} from "./invoices.types";
import { forEach } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  DurableFilterSlot,
  InvoiceFilterModel,
  InvoicesListQuery
} from "./invoices.types";
import type { ComputedRef } from "vue";

/**
 * The durable filter slots a scope seeds — the resolved `client_id` always
 * (a `.for('client', X)` target, or the session's own id), plus the ONE
 * relationship column a `.for('contract'|'contracts_product'|'invoice', id)`
 * names. The client id is reactive; a relationship id is static on
 * `config.context`. The seam reads both through `unref`.
 */
export function resolveFilterSlots(
  clientId: ComputedRef<string | undefined>,
  scopeContext?: ScopeContext
): DurableFilterSlot[] {
  const slots: DurableFilterSlot[] = [
    {
      key: INVOICES_CONTEXT_WIRE_KEYS[InvoicesContextTypes.CLIENT],
      value: clientId
    }
  ];

  const type = scopeContext?.type;
  if (
    scopeContext?.id &&
    type !== undefined &&
    type !== InvoicesContextTypes.CLIENT &&
    type in INVOICES_CONTEXT_WIRE_KEYS
  ) {
    slots.push({
      key: INVOICES_CONTEXT_WIRE_KEYS[type as InvoicesContextTypes],
      value: scopeContext.id
    });
  }

  return slots;
}

/**
 * Seeds each resolved slot's wire column onto the handle and keeps it tracking
 * its source. Every other declared filter is preserved; only the slot's own
 * key is (re)written.
 */
export function seedFilterSlots(
  handle: InvoicesListQuery,
  slots: DurableFilterSlot[]
): void {
  forEach(slots, slot =>
    watch(
      () => unref(slot.value),
      value => {
        const filters: InvoiceFilterModel = {
          ...handle.criteria.value.filters
        };
        if (value) filters[slot.key] = value;
        handle.setCriteria({ filters });
      },
      { immediate: true }
    )
  );
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
