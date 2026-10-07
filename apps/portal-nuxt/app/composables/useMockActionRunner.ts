// -----------------------------------------------------------------------------
/**
 * @module composables/useMockActionRunner
 * @description The shell half of the one action door (plan R4): dispatch a
 * value, then raise the feedback the RESULT names — a toast, a confirmation,
 * a form, a destination, in that order, with the accepted confirmation coming
 * back through this same door.
 *
 * Two call sites carry it: every module's `select` emit
 * (`shell/PortalSlotContent.vue`) and the impersonation ribbon's End control
 * (`layouts/default.vue`), which sits outside the slot system and would
 * otherwise fork the ordering.
 */

import { toast } from "@upmind/ui";
import { startsWith } from "lodash-es";
import type { MockActionResult } from "~/portal/mock/actions";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import { useConfirmDialog } from "~/composables/useConfirmDialog";
import { useFormDialog } from "~/composables/useFormDialog";
import { useProseDialog } from "~/composables/useProseDialog";
import { dispatchMockAction } from "~/portal/mock/actions";
import { resolveMockForm } from "~/portal/mock/forms/registry";
// -----------------------------------------------------------------------------

export function useMockActionRunner(
  data: () => MockDataset | undefined,
  context: () => DataRouteContext
): { run: (value: string) => Promise<void> } {
  const { request: requestConfirm } = useConfirmDialog();
  const {
    pending: pendingForm,
    open: openForm,
    close: closeForm
  } = useFormDialog();
  const { open: openProse } = useProseDialog();

  /**
   * A form closes on its OWN answer: the dispatched verb is the open form's
   * submit verb, and the facade's RECEIPT came back ok (`formDone`). Keyed on
   * the receipt rather than the toast, so a submit that navigates or answers
   * silently closes the form too; a refusal keeps the dialog up with what was
   * typed still in it.
   */
  function answersOpenForm(value: string, result: MockActionResult): boolean {
    const form = pendingForm.value;
    const dataset = data();
    if (form === undefined || dataset === undefined) return false;
    if (result.formDone !== true) return false;
    const entry = resolveMockForm(dataset, form.id, form.entityId);
    if (entry === undefined) return false;
    return startsWith(value, `${entry.submit}:`);
  }

  async function run(value: string): Promise<void> {
    const result = dispatchMockAction(data(), context(), value);
    if (result === undefined) return;
    if (answersOpenForm(value, result)) closeForm();
    if (result.toast !== undefined) {
      toast[result.toast.intent](result.toast.title, {
        description: result.toast.description
      });
    }
    // The accepted dialog comes back through THIS door, so its own result
    // toasts and navigates exactly as a first-hand emit does.
    if (result.confirm !== undefined) {
      requestConfirm(result.confirm, next => {
        void run(next);
      });
    }
    if (result.form !== undefined) openForm(result.form);
    if (result.prose !== undefined) openProse(result.prose);
    // An external destination LEAVES the portal (a provider's control panel),
    // so it opens beside it rather than replacing it. `noopener` because the
    // opened page is not ours.
    if (result.href !== undefined && typeof window !== "undefined") {
      window.open(result.href, "_blank", "noopener");
    }
    if (result.to !== undefined) await navigateTo(result.to);
  }

  return { run };
}
