// -----------------------------------------------------------------------------
/**
 * @module factory/useActionFeedback
 * @description Reports the outcome of an action a surface FIRED, to the user
 * who fired it: a toast carrying the API's own verdict, and a pending flag that
 * returns the control to rest whichever way it settles.
 *
 * A composable captures a failed mutation as STATE and never clears it, in the
 * same channel a failed list load lands in — so a surface reading that channel
 * back can neither report the failure once nor recover from it. The caller that
 * fired the action owns its outcome instead, and `isReported` lets that surface
 * drop the module's own copy of a failure it has already spoken for.
 */

import { ref } from "vue";
import { toast, TOAST_VARIANTS } from "@upmind-automation/upmind-ui";
import { get, includes, isString, pull } from "lodash-es";
import type {
  ActionFeedbackCopy,
  UseActionFeedback
} from "./useActionFeedback.types";
// -----------------------------------------------------------------------------

/** Mints one feedback seam per surface — pending state is that surface's own. */
export function useActionFeedback(): UseActionFeedback {
  const pending = ref<string[]>([]);
  const reported = ref<string | undefined>(undefined);

  function report(title: string, variant: string, description?: string): void {
    toast(title, {
      description,
      // @ts-expect-error -- `type` is omitted from ExternalToast but the toast component does accept it
      type: variant
    });
  }

  async function fire(
    key: string,
    invoke: () => unknown,
    copy: ActionFeedbackCopy
  ): Promise<void> {
    if (includes(pending.value, key)) return;
    pending.value.push(key);

    try {
      await invoke();
      report(copy.success, TOAST_VARIANTS.SUCCESS);
    } catch (error) {
      // The API's own sentence is the only copy that says WHY a request was
      // refused ("The default email cannot be changed to unverified email
      // address!"), so it rides as the toast's detail beside the action's
      // vocabulary rather than being replaced by it.
      const message = get(error, "message");
      reported.value = isString(message) ? message : undefined;

      report(copy.failure, TOAST_VARIANTS.DANGER, reported.value);
    } finally {
      pull(pending.value, key);
    }
  }

  return {
    fire,

    isPending: (key: string) => includes(pending.value, key),

    isReported: (error: unknown) => {
      const message = get(error, "message");
      return isString(message) && message === reported.value;
    }
  };
}
