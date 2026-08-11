// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/useActionFeedback
 * @description Reports the outcome of an action a surface FIRED, to the user
 * who fired it: a toast carrying the API's own verdict, a pending flag that
 * returns the control to rest whichever way it settles, and a per-control
 * verdict the surface marks the affected record with.
 *
 * A toast is a corner of the screen the user was not looking at, so it is never
 * the only place an outcome lands: the control that fired says it is working,
 * and the record it acted on says how it went — a failure held until dismissed
 * or retried, a success shown long enough to notice and then gone.
 *
 * A composable captures a failed mutation as STATE and never clears it, in the
 * same channel a failed list load lands in — so a surface reading that channel
 * back can neither report the failure once nor recover from it. The caller that
 * fired the action owns its outcome instead, and `isReported` lets that surface
 * drop the module's own copy of a failure it has already spoken for.
 */

import { ref } from "vue";
import { toast, TOAST_VARIANTS } from "@upmind-automation/upmind-ui";
import {
  assign,
  delay,
  get,
  has,
  includes,
  isString,
  omit,
  pull
} from "lodash-es";
import type {
  ActionFeedbackCopy,
  UseActionFeedback
} from "./useActionFeedback.types";
// -----------------------------------------------------------------------------

/** How long a settled action's own row keeps saying so. */
const SUCCESS_CUE_MS = 4000;

/** Mints one feedback seam per surface — pending state is that surface's own. */
export function useActionFeedback(): UseActionFeedback {
  const pending = ref<string[]>([]);
  const succeeded = ref<string[]>([]);
  const failures = ref<Record<string, string>>({});
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
    copy?: ActionFeedbackCopy
  ): Promise<boolean> {
    if (includes(pending.value, key)) return false;
    pending.value.push(key);
    // A retry starts from a clean control: the last attempt's verdict goes
    // before this one can leave its own.
    failures.value = omit(failures.value, [key]);
    pull(succeeded.value, key);

    try {
      await invoke();
      if (copy) report(copy.success, TOAST_VARIANTS.SUCCESS);
      succeeded.value.push(key);
      delay(() => pull(succeeded.value, key), SUCCESS_CUE_MS);
      return true;
    } catch (error) {
      // The API's own sentence is the only copy that says WHY a request was
      // refused ("The default email cannot be changed to unverified email
      // address!"), so it rides as the toast's detail beside the action's
      // vocabulary rather than being replaced by it.
      const message = get(error, "message");
      reported.value = isString(message) ? message : undefined;
      failures.value = assign({}, failures.value, {
        [key]: reported.value ?? copy?.failure ?? ""
      });

      if (copy) report(copy.failure, TOAST_VARIANTS.DANGER, reported.value);
      return false;
    } finally {
      pull(pending.value, key);
    }
  }

  return {
    fire,

    isSucceeded: (key: string) => includes(succeeded.value, key),

    failure: (key: string) =>
      has(failures.value, [key]) ? get(failures.value, [key], "") : undefined,

    dismiss: (key: string) => {
      failures.value = omit(failures.value, [key]);
    },

    isPending: (key: string) => includes(pending.value, key),

    isReported: (error: unknown) => {
      const message = get(error, "message");
      return isString(message) && message === reported.value;
    }
  };
}
