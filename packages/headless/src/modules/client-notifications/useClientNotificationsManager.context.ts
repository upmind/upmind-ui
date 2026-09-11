// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotificationsManager.context
 * @description Manager context factory — the reactive read side of the
 * machine context: the draft `model`, the `lookups` reference data
 * (`loadLookups` resolved before `available`, §D3), the form schema pair, and
 * the machine's captured `error` (defect F3's feedback surface, never raised
 * as an event — errors are state).
 *
 * `isEnabled` here reads the DRAFT — the manager's own state — which is the
 * split AC-5's revert read-back turns on (the collection's `isEnabled` reads
 * SERVER state).
 *
 * @doctrine §D10 — armless (no `.context.{actor}.ts` sibling).
 */

import {
  getLockedTopicIds,
  preferenceKey
} from "./client-notifications.mappers";
import { useUischema } from "./client-notifications.schemas";
import { useContext } from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  NotificationsContext,
  NotificationsLookups,
  NotificationsModel
} from "./client-notifications.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { UISchemaElement } from "@jsonforms/core";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------

export function createClientNotificationsManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const model = useContext<NotificationsModel>(state, "model");
  const lookups = useContext<NotificationsLookups>(state, "lookups");

  /** Draft state: reads the flat boolean record directly (`design.md` §D13). */
  function isEnabled(topicId: string, channelId: string): boolean {
    return (
      model.value?.preferences?.[preferenceKey(topicId, channelId)] ?? true
    );
  }

  /** Whether a topic is locked — `canOptOut === false` (§D7, computed once). */
  function isTopicLocked(topicId: string): boolean {
    return getLockedTopicIds(lookups.value?.topics).has(topicId);
  }

  const uischema = useContext<NotificationsContext["uischema"]>(
    state,
    "uischema"
  );

  /**
   * @decision
   * what:     `uischemaFor(topicIds)` builds the grid for the given TOPICS only,
   *           through the same `useUischema` the full form uses — whole topic
   *           groups, headings and locks intact.
   * why:      A row in this collection IS a topic, so a per-row edit opens the
   *           SAME draft editor scoped to that one topic — the profile page's
   *           per-field edit, applied to a grid. The field set is the topic's
   *           `topic::channel` keys plus its `__all` sentinel, expanded from
   *           `lookups.channels` because the grid is a runtime cross-product,
   *           not a fixed field list. Save stays diff-only on the manager's
   *           own `update()`, so only the edited topic is sent.
   * rejected: An interactive per-cell toggle drawn on the read-only collection
   *           row — the generic TableCell vocabulary has no such renderer and
   *           the collection's port carries none of the manager's write verbs
   *           (`client-notifications.presentation.ts`'s own `@decision`); the
   *           narrowed editor reaches the SAME `toggle`/`update` through the
   *           handoff path already in place, adding no parallel surface.
   */
  function uischemaFor(topicIds: string[]): UISchemaElement | undefined {
    if (isEmpty(topicIds) || !lookups.value) return uischema.value;
    return useUischema(lookups.value, topicIds);
  }

  // --- actor-specific context: none earned (§D10 — context: none).

  // NO whole-context passthrough (drift D27, `design.md` §D19): the emailed
  // link token is a bearer credential, and republishing the whole context
  // would put it on this public surface even though `NotificationsContext`
  // itself carries no `token` field (it lives only in
  // `useClientNotificationsManager.ts`'s closure — token-containment
  // follow-up, `review-notes.md` gap-closure pass). The named members below
  // already cover every read a consumer needs; a passthrough that must
  // remember to redact would forget the next field regardless.

  return {
    /** Machine-captured error, if any (defect F3's feedback surface) — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** Whether a topic x channel pair is enabled, read off the DRAFT. */
    isEnabled,

    /** Whether a topic is locked (`canOptOut === false`) and cannot be opted out of. */
    isTopicLocked,

    /** Reference data `loadLookups` resolved (topics, channels). */
    lookups,

    /** The current draft model. */
    model,

    /** The JSON schema for the form (from machine context). */
    schema: useContext<NotificationsContext["schema"]>(state, "schema"),

    /** The UI schema for the form (from machine context). */
    uischema,

    /**
     * The UI schema narrowed to the given TOPICS' own grid controls — the
     * per-row editor's field set. See this factory's `@decision`.
     */
    uischemaFor,

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientNotificationsManagerContext = ReturnType<
  typeof createClientNotificationsManagerContext
>;
