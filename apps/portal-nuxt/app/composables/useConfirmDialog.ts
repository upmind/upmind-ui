// -----------------------------------------------------------------------------
/**
 * @module composables/useConfirmDialog
 * @description The shell's ONE confirmation (plan R4). A dispatched action
 * may answer with a `confirm` instead of mutating; this holds it until the
 * client answers, and hands the accepted verb back to the caller that raised
 * it — so the re-dispatch goes through the same door as the first one. No
 * module ever sees this: the state is the shell's.
 */

import { ref } from "vue";
import type { Ref } from "vue";
import type { MockActionConfirm } from "~/portal/mock/actions";
// -----------------------------------------------------------------------------

/** What the shell dispatches when the client accepts — an action value, as any module would emit. */
type ConfirmCommand = {
  readonly then: string;
  readonly run: (value: string) => void;
};

const pending = ref<MockActionConfirm | undefined>(undefined);

/**
 * Held OUTSIDE `pending` on purpose: the design system's action button closes
 * the dialog root BEFORE it emits `action`, so the close has already cleared
 * `pending` by the time `accept()` runs. A cancelled command is simply never
 * reached again, and the next `request()` overwrites it.
 */
let command: ConfirmCommand | undefined;

export function useConfirmDialog(): {
  pending: Ref<MockActionConfirm | undefined>;
  request: (confirm: MockActionConfirm, run: (value: string) => void) => void;
  accept: () => void;
  cancel: () => void;
  close: () => void;
} {
  /** Opens the dialog on one confirmation, naming who runs its accepted verb. */
  function request(
    confirm: MockActionConfirm,
    run: (value: string) => void
  ): void {
    pending.value = confirm;
    command = { then: confirm.then, run };
  }

  /** The dialog closed itself (accepted, dismissed, escaped) — the confirmation is over. */
  function close(): void {
    pending.value = undefined;
  }

  function accept(): void {
    const accepted = command;
    command = undefined;
    close();
    if (accepted === undefined) return;
    accepted.run(accepted.then);
  }

  function cancel(): void {
    command = undefined;
    close();
  }

  return { pending, request, accept, cancel, close };
}
