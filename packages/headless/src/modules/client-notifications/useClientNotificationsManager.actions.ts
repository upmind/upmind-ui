// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotificationsManager.actions
 * @description Manager actions factory — the editor's draft-mutating verbs
 * (`toggle`, `selectAll`, `clearAll`, `revert`, `input`, `update`) plus
 * lifecycle. Reads machine state back through the canonical state utilities
 * only, never `state.value.context` directly.
 */

import { watch } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  SELECT_ALL_CHANNEL_ID,
  expandSelectAllSentinels,
  getLockedTopicIds,
  isTopicFullySelected,
  preferenceKey,
  splitPreferenceKey
} from "./client-notifications.mappers";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  contextValue,
  responseCodes,
  stateMatches,
  stopService
} from "../../utils";
import { debounce, each, get, isEmpty, isEqual, keys } from "lodash-es";
import type {
  NotificationsLookups,
  NotificationsModel
} from "./client-notifications.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

export function createClientNotificationsManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string,
  token: string | undefined
) {
  const { state, send, service: machineService } = actor;
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();
  const { t } = useI18n();

  function getModel(): NotificationsModel | undefined {
    return contextValue<NotificationsModel>(state, "model");
  }

  function getBaseModel(): NotificationsModel | undefined {
    return contextValue<NotificationsModel>(state, "baseModel");
  }

  function getLookups(): NotificationsLookups | undefined {
    return contextValue<NotificationsLookups>(state, "lookups");
  }

  function isTopicLocked(topicId: string): boolean {
    return getLockedTopicIds(getLookups()?.topics).has(topicId);
  }

  /** Sends the FULL next flat record — the machine's `parse`/`validate` re-check it. */
  function setPreferences(preferences: Record<string, boolean>): void {
    send({ type: "SET", data: { preferences } });
  }

  /** Turns one channel on/off for one topic (AC-3). Refused for a locked topic (AC-6). */
  async function toggle(topicId: string, channelId: string): Promise<void> {
    if (isTopicLocked(topicId)) return;

    await debouncedSendInput.flush()?.catch(() => undefined);

    const key = preferenceKey(topicId, channelId);
    const preferences = { ...(getModel()?.preferences ?? {}) };
    preferences[key] = !(preferences[key] ?? true);

    setPreferences(preferences);
  }

  /** Turns every channel ON for one topic (AC-4). Refused for a locked topic (AC-6). */
  async function selectAll(topicId: string): Promise<void> {
    if (isTopicLocked(topicId)) return;

    await debouncedSendInput.flush()?.catch(() => undefined);

    const channels = getLookups()?.channels ?? [];
    const preferences = { ...(getModel()?.preferences ?? {}) };
    each(channels, channel => {
      preferences[preferenceKey(topicId, channel.id)] = true;
    });

    setPreferences(preferences);
  }

  /** Turns every channel OFF for one topic (AC-4). Refused for a locked topic (AC-6). */
  async function clearAll(topicId: string): Promise<void> {
    if (isTopicLocked(topicId)) return;

    await debouncedSendInput.flush()?.catch(() => undefined);

    const channels = getLookups()?.channels ?? [];
    const preferences = { ...(getModel()?.preferences ?? {}) };
    each(channels, channel => {
      preferences[preferenceKey(topicId, channel.id)] = false;
    });

    setPreferences(preferences);
  }

  /** True if every channel is enabled for the given topic (AC-4). */
  function isAllSelected(topicId: string): boolean {
    return isTopicFullySelected(
      getModel()?.preferences ?? {},
      getLookups()?.channels ?? [],
      topicId
    );
  }

  /** Restores the draft to the server-held baseline and clears dirty (AC-5). */
  async function revert(): Promise<void> {
    await debouncedSendInput.flush()?.catch(() => undefined);
    setPreferences(getBaseModel()?.preferences ?? {});
  }

  /**
   * The locked-topic guard for `update`'s arbitrary-model entry point. Drops a
   * row for a locked topic only when it is not already server-held — a
   * pre-existing opt-out on a since-locked topic must survive an unrelated
   * save. `toggle`/`selectAll`/`clearAll` refuse at the top of each function.
   *
   * @decision
   * what:     The guard filters the incoming value before it is sent, next to
   *           `toggle`/`selectAll`/`clearAll`.
   * why:      `validate` is consulted for its settlement only, so a filtered
   *           return value there never reaches `writeOptOuts`; and rejecting
   *           in `validate` would filter every save, deleting a pre-existing
   *           locked row. `update` is the one entry point that can draw the
   *           new-vs-pre-existing distinction against `baseModel`.
   * rejected: Wiring `validate`'s value into context (edits the shared
   *           machine, and cannot express the distinction anyway); blanket-
   *           stripping every locked row on every save (regressive).
   */
  function sanitizeLockedPreferences(
    preferences: Record<string, boolean>
  ): Record<string, boolean> {
    const lockedTopicIds = getLockedTopicIds(getLookups()?.topics);
    if (lockedTopicIds.size === 0) return preferences;

    const basePreferences = getBaseModel()?.preferences ?? {};
    const sanitized = { ...preferences };
    each(keys(sanitized), key => {
      const { topicId } = splitPreferenceKey(key);
      if (lockedTopicIds.has(topicId)) {
        sanitized[key] = basePreferences[key] ?? true;
      }
    });
    return sanitized;
  }

  /**
   * The running "as-if-landed" preferences for the current debounce burst.
   * Retains each topic's sentinel at the value its own triggering call carried,
   * so a later call in the same burst can detect a genuine sentinel flip.
   * Reset once the debounced send runs.
   */
  let pendingPreferences: Record<string, boolean> | undefined;

  /**
   * The draft as it stood when the in-flight `SET` was sent. Non-undefined
   * only while that send has yet to be parsed — see `isStaleEcho`.
   */
  let inFlightFrom: Record<string, boolean> | undefined;

  /**
   * The last payload `input` accepted in the current burst.
   *
   * @decision
   * what:     A payload deep-equal to the one `input` last accepted this burst
   *           is dropped.
   * why:      The controlled form emits twice per click with an identical
   *           payload; the second copy carries pre-expansion channel values
   *           that would overwrite the expansion — the "selection disappears".
   * rejected: Forcing expanded keys back to the expanded value — breaks a
   *           genuine per-channel exception issued in the same window;
   *           comparing against the pre-send model (misses this case).
   */
  let lastAccepted: Record<string, boolean> | undefined;

  /**
   * True when `value` is the controlled form echoing back the draft it was
   * still rendering when we sent, rather than a new instruction.
   *
   * @decision
   * what:     An `input` whose `preferences` deep-equals the draft the
   *           in-flight `SET` was sent from is dropped until that send parses.
   * why:      The form binds `:model-value` to the machine model, so every
   *           write re-renders it and the form re-emits the pre-send value;
   *           the trailing debounce keeps that echo and the change vanishes.
   * rejected: Comparing against the current model (a real revert becomes
   *           indistinguishable once our send lands); de-duplicating in the
   *           shared form engine (every debounced consumer has this loop).
   */
  function isStaleEcho(
    value: NotificationsModel | Record<string, unknown>
  ): boolean {
    if (!inFlightFrom) return false;
    const incoming = (value as Partial<NotificationsModel>)?.preferences;
    return !!incoming && isEqual(incoming, inFlightFrom);
  }

  /**
   * The synchronous half of `input` — runs on EVERY call, never debounced,
   * so `expandSelectAllSentinels` sees each click's own instruction rather
   * than only the trailing call's. See `input`'s decision block.
   */
  function expandInput(
    value: NotificationsModel | Record<string, unknown>
  ): NotificationsModel | Record<string, unknown> {
    const lookups = getLookups();
    const topics = lookups?.topics ?? [];
    const channelsList = lookups?.channels ?? [];
    const incoming = (value as Partial<NotificationsModel>)?.preferences ?? {};
    const previous = pendingPreferences ?? getModel()?.preferences;
    const expanded = expandSelectAllSentinels(
      incoming,
      previous,
      topics,
      channelsList
    );

    const tracked = { ...expanded };
    each(topics, topic => {
      const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
      if (sentinelKey in incoming) tracked[sentinelKey] = incoming[sentinelKey];
    });
    pendingPreferences = tracked;

    return { ...value, preferences: sanitizeLockedPreferences(expanded) };
  }

  /**
   * The debounced half of `input` — sends the already-expanded draft and
   * resolves the parsed/validated model.
   *
   * @decision
   * what:     `sanitizeLockedPreferences` filters the incoming `preferences`
   *           before the `SET` is sent, as `update(value)` also does.
   * why:      `input` accepts an arbitrary model like `update(value)`, so it
   *           needs the same new-vs-pre-existing distinction against
   *           `baseModel`, not a second rule.
   * rejected: Relying on `update`'s guard at save time — a locked flip would
   *           sit visibly in `model` between input and save.
   */
  async function sendInput(
    value: NotificationsModel | Record<string, unknown>
  ): Promise<NotificationsModel> {
    inFlightFrom = getModel()?.preferences;
    send({ type: "SET", data: value });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => {
        // Cleared only once the machine has PARSED, never at send time: the
        // leading-edge send below returns before `context.model` reflects it,
        // so a click arriving in that gap must still read the accumulated
        // burst baseline rather than the stale pre-send model (the B1 class).
        pendingPreferences = undefined;
        inFlightFrom = undefined;
        lastAccepted = undefined;
        return get(s, "context.model") as NotificationsModel;
      })
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  /**
   * @decision
   * what:     Leading and trailing edge, not lodash's trailing-only default.
   * why:      The controlled form binds `:model-value` to the machine, so a
   *           trailing-only delay makes a bound checkbox deselect itself and
   *           re-emit the baseline, which the trailing call then sends. Leading
   *           fires the first click at once; trailing still collapses the rest.
   * rejected: Removing the debounce (burst protection `update()` flushes);
   *           local optimistic state in the form (a second source of truth).
   */
  const debouncedSendInput = debounce(sendInput, DEBOUNCE_DELAY, {
    leading: true,
    trailing: true
  });

  /**
   * Inputs a draft and resolves the parsed/validated model. Only the send is
   * debounced; the sentinel expansion runs synchronously on every call.
   *
   * @decision
   * what:     `expandSelectAllSentinels` runs synchronously on every call via
   *           `expandInput`, before the debounce; only the sending is debounced.
   * why:      The debounce is trailing-only, so folding the expansion into the
   *           lone surviving call compared it against the stale pre-burst model
   *           and overwrote a channel a later click had just set. Running it
   *           per call captures each click's own instruction.
   * rejected: Flushing before a bulk change (re-enters the machine mid-burst);
   *           a bare boolean sentinel flag (cannot express per-channel
   *           protection); lengthening or removing the debounce (out of scope).
   */
  function input(
    value: NotificationsModel | Record<string, unknown>
  ): Promise<NotificationsModel> | undefined {
    if (isResetArtefact(value)) return undefined;
    if (isStaleEcho(value)) return undefined;
    const incoming = (value as Partial<NotificationsModel>)?.preferences;
    if (incoming && lastAccepted && isEqual(incoming, lastAccepted)) {
      return undefined;
    }
    if (incoming) lastAccepted = { ...incoming };
    return debouncedSendInput(expandInput(value));
  }

  /**
   * True when `value` is the shared form engine clearing itself, not a user
   * instruction.
   *
   * @decision
   * what:     An `input` whose `preferences` is absent or empty is dropped
   *           while the draft holds keys.
   * why:      The form host sets the model to `{}` and emits before it emits
   *           `reject`, so Revert delivers an empty model a tick early; on the
   *           leading edge that empties the draft and parks the machine invalid.
   * rejected: Changing the shared form host (every consumer); a trailing-only
   *           debounce (reinstates the deselect defect); relying on
   *           `destroy()`'s cancel (cannot cancel a send already made).
   */
  function isResetArtefact(
    value: NotificationsModel | Record<string, unknown>
  ): boolean {
    const incoming = (value as Partial<NotificationsModel>)?.preferences;
    if (!isEmpty(incoming)) return false;
    return !isEmpty(getModel()?.preferences);
  }

  /**
   * True once a bare retry needs to resend the model rather than a bare
   * `UPDATE` (AC-7) — `available.error`/`available.invalid` have no `UPDATE`
   * handler in the shared machine.
   */
  function needsResendToRetry(): boolean {
    return stateMatches(state, ["available.error", "available.invalid"]);
  }

  /**
   * Sends the current (or provided) model for the full-set save, resolving the
   * persisted model. Refuses when nothing is dirty — the same
   * `model`-vs-`baseModel` comparison `isDirty` uses.
   *
   * @decision
   * what:     A retry with no `value` while settled in
   *           `available.error`/`available.invalid` resends the draft as `SET`
   *           (with `update: true`), not a bare `UPDATE`.
   * why:      Those leaves have no `UPDATE` handler, so a bare retry resolved
   *           against the stale error immediately; `SET` is handled and re-runs
   *           `parse`/`validate`, issuing a genuine second PUT.
   * rejected: Always routing through `SET` — re-runs `parse`/`validate` on
   *           every ordinary save, wider than the retry needs.
   *
   * @decision
   * what:     `debouncedSendInput.flush()` is awaited first; the dirty gate
   *           reads the effective model, never `getModel()` alone.
   * why:      A keystroke inside the debounce window has not reached
   *           `context.model` when `update()` runs; and gating on `getModel()`
   *           alone let `update(currentDraft)` skip the comparison and PUT a no-op.
   * rejected: Gating only on the passed `value` — leaves the no-argument door's
   *           bug alive.
   */
  async function update(
    value?: NotificationsModel
  ): Promise<NotificationsModel> {
    await debouncedSendInput.flush()?.catch(() => undefined);

    const nextValue = value
      ? { ...value, preferences: sanitizeLockedPreferences(value.preferences) }
      : undefined;
    const effectiveModel = nextValue ?? getModel();

    if (isEqual(effectiveModel, getBaseModel())) {
      return Promise.reject(new Error("Nothing to save"));
    }

    if (nextValue) {
      send({ type: "SET", data: nextValue, update: true });
    } else if (needsResendToRetry()) {
      send({ type: "SET", data: getModel(), update: true });
    } else {
      send({ type: "UPDATE" });
    }

    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "available.error", "available.invalid"]),
      { timeout: 60_000 }
    ).then(s => {
      if (stateMatches(s, ["available.error", "available.invalid"])) {
        throw s.context.error;
      }
      return s.context.model as NotificationsModel;
    });
  }

  /**
   * This scope's settled addressability outcome, or `undefined` while the
   * session is still settling — the same `!!token || !!clientId` question
   * `hasSubscription` asks. `token` reads the closure; `clientId` reads context,
   * which can change late.
   */
  function addressableOutcome(): boolean | undefined {
    const isAddressable = !!token || !!contextValue<string>(state, "clientId");
    if (isAddressable) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling — a client with no token and no session settles `false` once
   * the session store initialises, never forever.
   */
  function whenSessionSettles(): Promise<boolean> {
    const outcome = addressableOutcome();
    if (outcome !== undefined) return Promise.resolve(outcome);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [state, isSessionInitialised, isSessionSettling],
        () => {
          const settled = addressableOutcome();
          if (settled === undefined) return;
          stop();
          resolve(settled);
        }
      );
    });
  }

  /**
   * Resolves when the manager is ready to accept input, false when it never
   * will be. `unavailable` is a dead end no transition leaves, so settling
   * false there converts a hang into an answer the caller can branch on.
   *
   * @decision
   * what:     `whenSessionSettles()` is awaited first; only on `true` do we
   *           `waitFor` `["available", "unavailable"]`, bounded at 60s.
   * why:      A client with no token and no session never satisfies
   *           `hasSubscription`, so the machine never leaves `subscribing`;
   *           `addressableOutcome()` knows whether it ever will, so it settles
   *           `false` when the session settles rather than on a wall clock.
   * rejected: `timeout: Infinity` or a bare wall-clock bound — the stall class
   *           this module exists to keep out.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return waitFor(
      machineService,
      s => stateMatches(s, ["available", "unavailable"]),
      { timeout: 60_000 }
    )
      .then(
        s =>
          !stateMatches(s, "unavailable") && !stateMatches(s, "available.error")
      )
      .catch(() => false);
  }

  /** Resolves once a save has completed. */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s => stateMatches(s, ["processed", "complete"]),
      {
        timeout: Infinity
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  /** Resolves true once the machine captures a save failure (defect F3 fix, AC-7). */
  async function onError(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available.error"), {
      timeout: Infinity
    })
      .then(() => true)
      .catch(() => false);
  }

  /** Stops the underlying machine (without removing it from the registry). */
  async function stop(): Promise<void> {
    await debouncedSendInput.flush()?.catch(() => undefined);
    stopService(machineService);
  }

  /** Destroys this scoped instance — stops the machine AND removes it from the registry. */
  async function destroy(): Promise<void> {
    await debouncedSendInput.flush()?.catch(() => undefined);
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned (§D10 — actions: none).

  return {
    /** Turns every channel off for one topic. Refused for a locked topic. */
    clearAll,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /**
     * Sends a draft (debounced) and resolves the parsed/validated model.
     * Refused for a locked topic, same as `toggle`/`update(value)`.
     */
    input,

    /** Resolves true once the manager is ready, false on error. */
    isReady,

    /** Whether every channel is enabled for a given topic. */
    isAllSelected,

    /** Resolves true once a save has completed. */
    onDone,

    /** Resolves true once the machine has captured a save failure. */
    onError,

    /** Restores the draft to the server-held baseline; clears dirty. */
    revert,

    /** Turns every channel on for one topic. Refused for a locked topic. */
    selectAll,

    /** Stops the underlying machine. */
    stop,

    /** Turns one channel on/off for one topic. Refused for a locked topic. */
    toggle,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientNotificationsManagerActions = ReturnType<
  typeof createClientNotificationsManagerActions
>;
