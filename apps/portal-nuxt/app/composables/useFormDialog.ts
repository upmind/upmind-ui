// -----------------------------------------------------------------------------
/**
 * @module composables/useFormDialog
 * @description The shell's ONE form dialog (plan F2), beside its one
 * confirmation. A dispatched action may answer with a `form` instead of
 * mutating; this holds which form is open until it is answered or dismissed.
 * No module ever sees this: the state is the shell's, exactly as the
 * confirmation's is (composables/useConfirmDialog.ts).
 */

import { ref } from "vue";
import type { Ref } from "vue";
import type { MockActionForm } from "~/portal/mock/actions";

const pending = ref<MockActionForm | undefined>(undefined);

export function useFormDialog(): {
  pending: Ref<MockActionForm | undefined>;
  open: (form: MockActionForm) => void;
  close: () => void;
} {
  /** Opens the dialog on one registered form (mock/forms/registry.ts). */
  function open(form: MockActionForm): void {
    pending.value = form;
  }

  /** The dialog is over — submitted, dismissed or escaped. */
  function close(): void {
    pending.value = undefined;
  }

  return { pending, open, close };
}
