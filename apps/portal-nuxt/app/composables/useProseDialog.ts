// -----------------------------------------------------------------------------
/**
 * @module composables/useProseDialog
 * @description The shell's ONE read-only dialog, beside its confirmation and
 * its form (plan F2). A dispatched action may answer with `prose` — something
 * the brand or the provider wrote for the client to read, with nothing to
 * submit — and this holds it until the client closes it. No module ever sees
 * this: the state is the shell's, exactly as the other two dialogs' is.
 */

import { ref } from "vue";
import type { Ref } from "vue";
import type { MockActionProse } from "~/portal/mock/actions";
// -----------------------------------------------------------------------------

const pending = ref<MockActionProse | undefined>(undefined);

export function useProseDialog(): {
  pending: Ref<MockActionProse | undefined>;
  open: (prose: MockActionProse) => void;
  close: () => void;
} {
  /** Opens the dialog on one piece of authored prose. */
  function open(prose: MockActionProse): void {
    pending.value = prose;
  }

  /** The dialog is over — dismissed or escaped; it asks nothing, so there is no other way out. */
  function close(): void {
    pending.value = undefined;
  }

  return { pending, open, close };
}
