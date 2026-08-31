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
 *
 * The capture is also the only witness a refusal has: a service that reports
 * through its own feedback channel handles the rejection and RESOLVES, so an
 * outcome graded on the promise alone reads every refusal as a success. The
 * surface hands in that channel and the outcome is graded on both.
 */

import { toast } from "@upmind/ui";
import { nextTick, ref } from "vue";
import {
  assign,
  delay,
  get,
  has,
  includes,
  isNil,
  isString,
  omit,
  pull
} from "lodash-es";
import type {
  ActionFailureChannel,
  ActionFeedbackCopy,
  UseActionFeedback
} from "./useActionFeedback.types";
// -----------------------------------------------------------------------------

/** How long a settled action's own row keeps saying so. */
const SUCCESS_CUE_MS = 4000;

/**
 * Mints one feedback seam per surface — pending state is that surface's own.
 * @param observe The surface's module failure channel. Absent, an action is
 * graded on its promise alone, which is all a service that REJECTS ever offers.
 */
export function useActionFeedback(
  observe?: ActionFailureChannel
): UseActionFeedback {
  const pending = ref<string[]>([]);
  const succeeded = ref<string[]>([]);
  const failures = ref<Record<string, string>>({});
  const reported = ref<string | undefined>(undefined);
  const reportedDetail = ref<unknown>(undefined);

  function report(title: string, variant: string, description?: string): void {
    toast(title, {
      description,
      // @ts-expect-error -- `type` is omitted from ExternalToast but the toast component does accept it
      type: variant
    });
  }

  /**
   * Records ONE refusal against the control that drew it.
   * @param key The control that fired.
   * @param error The refusal — a rejection, or the module's own capture.
   * @param copy The action's declared sentences, where it named any.
   * @returns Always `false` — a refusal is never a settled action.
   */
  function refuse(
    key: string,
    error: unknown,
    copy?: ActionFeedbackCopy
  ): boolean {
    // The API's own sentence is the only copy that says WHY a request was
    // refused ("The default email cannot be changed to unverified email
    // address!"), so it rides as the toast's detail beside the action's
    // vocabulary rather than being replaced by it.
    const message = get(error, "message");
    reported.value = isString(message) ? message : undefined;
    reportedDetail.value = error;
    failures.value = assign({}, failures.value, {
      [key]: reported.value ?? copy?.failure ?? ""
    });

    if (copy) report(copy.failure, "error", reported.value);
    return false;
  }

  /**
   * The module's verdict on the action that just settled, or nothing.
   *
   * A service may report a refusal through its own feedback channel and then
   * RESOLVE, so a fulfilled promise is not a success — it is silence. What the
   * module captured while the action was in flight is the answer, and a capture
   * that was already there before it fired belongs to an earlier attempt.
   *
   * @param before The channel's value at the moment the action fired.
   */
  async function captured(before: unknown): Promise<unknown> {
    if (!observe) return undefined;
    await nextTick();
    const after = observe();
    return after === before ? undefined : after;
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
    const before = observe?.();

    try {
      await invoke();
      const refusal = await captured(before);
      if (!isNil(refusal)) return refuse(key, refusal, copy);

      if (copy) report(copy.success, "success");
      succeeded.value.push(key);
      delay(() => pull(succeeded.value, key), SUCCESS_CUE_MS);
      return true;
    } catch (error) {
      return refuse(key, error, copy);
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
      if (!isNil(error) && error === reportedDetail.value) return true;
      const message = get(error, "message");
      return isString(message) && message === reported.value;
    }
  };
}
