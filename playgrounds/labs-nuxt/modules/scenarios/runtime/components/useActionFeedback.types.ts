// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/useActionFeedback.types
 * @description Type definitions for the action-outcome seam — the surface that
 * FIRES an action reports it.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * feedback/outcome node exists; the members below widen this seam rather than
 * minting a second one for the editor's save.
 */

// -----------------------------------------------------------------------------

/** One action's already-resolved sentences; the surface owns the vocabulary. */
export type ActionFeedbackCopy = {
  success: string;
  failure: string;
};

/**
 * Reads the module's OWN captured failure — the four-layer `context` error the
 * surface already renders. A service that reports a refusal through its own
 * feedback channel HANDLES the rejection and resolves, so the promise says
 * nothing; the capture is the only place that refusal survives.
 *
 * Read back on the flush after the action settles: the module holds the capture
 * as state, which reaches the surface's snapshot when it next renders.
 *
 * @graphify-citation `graphify query "captured module failure channel observer
 * error reader type"` (2026-08-28) — no captured-failure or observer node exists
 * in `graphify-out/graph.json`, so nothing is re-declared here.
 */
export type ActionFailureChannel = () => unknown;

export type UseActionFeedback = {
  /**
   * Fires one action and reports its outcome, holding it pending until it
   * settles so the control it came from returns to rest either way.
   * @param key Identifies the control in flight — an action name, or that name
   * and the row it acts on.
   * @param invoke The live action call, already bound to its input.
   * @param copy The resolved sentences this action reports itself with. Absent,
   * the outcome is still returned but nothing is said — a caller whose
   * declaration names no copy stays silent rather than toasting an empty title.
   * @returns Whether the action settled successfully — what an editor closes on.
   * A rejection and a captured refusal both settle as `false`.
   */
  fire(
    key: string,
    invoke: () => unknown,
    copy?: ActionFeedbackCopy
  ): Promise<boolean>;

  /** True while the keyed control's action is in flight. */
  isPending(key: string): boolean;

  /**
   * True for as long as the keyed control's last action stays worth pointing
   * at — the cue that says WHICH record just changed, beside the toast that
   * says what happened. It expires on its own; nothing clears it.
   */
  isSucceeded(key: string): boolean;

  /**
   * The keyed control's last failure, held until it is dismissed or the action
   * is fired again — the API's own sentence where it gave one, the action's
   * declared failure copy otherwise. `undefined` where the control has not
   * failed; an empty string where a copy-less action failed silently.
   */
  failure(key: string): string | undefined;

  /** Drops the keyed control's failure — the user's own "I've seen it". */
  dismiss(key: string): void;

  /**
   * True when the module's captured error is one this seam already reported —
   * the very value read back off the failure channel, or a rejection carrying
   * the same sentence.
   */
  isReported(error: unknown): boolean;
};
