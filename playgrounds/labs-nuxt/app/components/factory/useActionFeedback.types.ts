// -----------------------------------------------------------------------------
/**
 * @module factory/useActionFeedback
 * @description Type definitions for the action-outcome seam — the surface that
 * FIRES an action reports it (design.md FE-2977 §Block C).
 */

// -----------------------------------------------------------------------------

/** One action's already-resolved sentences; the surface owns the vocabulary. */
export type ActionFeedbackCopy = {
  success: string;
  failure: string;
};

export type UseActionFeedback = {
  /**
   * Fires one action and reports its outcome, holding it pending until it
   * settles so the control it came from returns to rest either way.
   * @param key Identifies the control in flight — an action name, or that name
   * and the row it acts on.
   * @param invoke The live action call, already bound to its input.
   * @param copy The resolved sentences this action reports itself with.
   */
  fire(
    key: string,
    invoke: () => unknown,
    copy: ActionFeedbackCopy
  ): Promise<void>;

  /** True while the keyed control's action is in flight. */
  isPending(key: string): boolean;

  /** True when the module's captured error is one this seam already reported. */
  isReported(error: unknown): boolean;
};
