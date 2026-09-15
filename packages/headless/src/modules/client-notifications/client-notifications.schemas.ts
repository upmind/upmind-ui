/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module client-notifications/client-notifications.schemas
 * @description Two schema families:
 *
 * 1. `useQuerySchema()` — the criteria schema shared by all three reads
 *    (ruling B, recorded verbatim in `design.md` §D2): declares ONLY
 *    `pagination.limit.default = 0`. No `filters` branch, no `sort` member —
 *    D14/D15 are not applicable to this module (`design.md` §D2), and an
 *    unknown `order=` is an HTTP 500 (`client-phone.schemas.ts:137-138`).
 * 2. `useSchema(lookups)` / `useUischema(lookups)` — the manager's DERIVED
 *    form pair, consumed ONLY by `useClientNotificationsManager.machine.ts`'s
 *    `setSchemas` action. One boolean property per topic x channel pair,
 *    derived from the resolved `lookups` (operator ruling (c), `design.md`
 *    §D13 — the spine of the gap-closure pass). Shared by both actors
 *    (§D10 — `schemas: none`): the derivation input (topics x client-recipient
 *    channels) does not vary by actor, so the derived field set is
 *    byte-identical per actor by construction.
 *
 * @doctrine `code-ui.companion.md` (Uischema/JSONForms) — every element MUST
 * carry an `i18n` property; mandatory and non-negotiable. This field set is
 * RUNTIME-derived, so every element ALSO carries the runtime `label` (the
 * topic's/channel's own server-supplied `name`) alongside the `i18n` key
 * (`review-notes.md` §C8 — surfaced, resolved as stated there).
 */

import {
  preferenceKey,
  SELECT_ALL_CHANNEL_ID
} from "./client-notifications.mappers";
import { each, filter, includes, map } from "lodash-es";
import type { NotificationsLookups } from "./client-notifications.types";
import type { ScopeActorTypes } from "../scope";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------
// Query schema — ruling B, recorded verbatim (design.md §D2)

/**
 * @decision
 * what:     Declares ONLY `pagination.limit.default = 0`. No `filters`
 *           branch. No `sort` member.
 * why:      Operator ruling B (tier 1, recorded verbatim in `design.md` §D2).
 *           The full set is always taken and used on every read — topics,
 *           channels and opt-outs — so a server default page never silently
 *           shortens the grid (a missing opt-out row renders as ENABLED, a
 *           wrong preference, not a missing row — AC-2). No column on this
 *           module's three endpoints is proven filterable or sortable by the
 *           oracle, and declaring beyond it is an unsafe guess: an unknown
 *           `order=` column is an HTTP 500 (`client-phone.schemas.ts:137-138`).
 * rejected: A `filters`/`sort` branch "for later" — the oracle offers neither
 *           on any of the three endpoints (`design.md` §D2), so declaring one
 *           would publish a control the server rejects.
 */
export function useQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: { limit: { type: "number", default: 0 } }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * @decision (D5/D6/D8/D9, `parity.yaml` row `collection-query-contract`)
 * what:     An EMPTY layout — no elements, no `filters`-scoped control.
 * why:      `useQuerySchema()` declares no `filters` branch (ruling B,
 *           recorded verbatim in `design.md` §D2) — there is nothing in the
 *           criteria model this uischema could scope a control to. The key
 *           exists so a consumer's `schemas.query` read is uniform with every
 *           sibling collection's shape (`useClientEmailsContext.schemas.query`),
 *           never because there is a control to draw.
 * rejected: Omitting the key entirely — a consumer reading
 *           `schemas.query.uischema` off THIS module and every sibling alike
 *           should never have to branch on whether the module happens to have
 *           filters; the uniform shape is the contract, an empty layout is
 *           the honest content.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: []
  } satisfies UISchemaElement;
}

/**
 * @decision (D5/D6/D8/D9, `parity.yaml` row `collection-query-contract`)
 * what:     An EMPTY layout — no `Control` scoped to `#/properties/sort`.
 * why:      `useQuerySchema()` declares no `sort` member at all (ruling B) —
 *           a `Control` scoped there would address a schema property that
 *           does not exist. No oracle endpoint this module reads is proven
 *           sortable (`design.md` §D2), so inventing an enum of sortable
 *           columns "for later" would publish a control the server rejects
 *           (the same reasoning `useQuerySchema()`'s own `@decision` states)
 *           — an honest empty layout, not a guessed one.
 * rejected: A `Control` scoped to a fabricated `#/properties/sort` enum —
 *           `verify-cosplay.md`: right shape, no oracle capability behind it.
 */
export function useSortUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: []
  } satisfies UISchemaElement;
}

// -----------------------------------------------------------------------------
// Manager form schema — the topic x channel grid, DERIVED from `lookups`

/**
 * @decision
 * what:     A flat boolean property per topic x channel pair
 *           (`preferenceKey`), derived from the resolved `lookups` rather
 *           than authored ahead of time.
 * why:      The manager's model is the flat boolean record `NotificationsModel`
 *           (`design.md` §D13) — the set of topics/channels is resolved at
 *           runtime, so the schema must be derived from `lookups`, not
 *           authored against a fixed shape. `default: true` matches
 *           `isEnabled`'s own `?? true` fallback (absence from the server
 *           opt-out set means enabled).
 * rejected: An `optOuts` ARRAY field with a JSONForms array renderer —
 *           array renderers assume an editable list of records with
 *           add/remove affordances; this grid is a fixed cross-product of two
 *           OTHER reference lists with per-cell toggles, which is not that
 *           shape. §D2's original rejection of this shape still stands.
 *
 * Also declares one bulk-toggle SENTINEL boolean per topic
 * (`preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID)`) — DECLARED, not
 * optional: `additionalProperties: false` refuses an undeclared key, and the
 * derived uischema below draws a control at this scope. Expanded to every
 * real channel and deleted before it reaches the machine model
 * (`useClientNotificationsManager.actions.ts`'s `input`) — it never
 * represents a real opt-out row.
 */
export function useSchema(lookups: NotificationsLookups): JsonSchema7 {
  const properties: Record<string, JsonSchema7> = {};
  each(lookups.topics, topic => {
    const locked = topic.canOptOut === false ? { readOnly: true } : {};
    each(lookups.channels, channel => {
      properties[preferenceKey(topic.id, channel.id)] = {
        type: "boolean",
        default: true,
        ...locked
      };
    });
    properties[preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID)] = {
      type: "boolean",
      default: true,
      ...locked
    };
  });

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      preferences: {
        type: "object",
        additionalProperties: false,
        properties
      }
    }
  } satisfies JsonSchema7;
}

/**
 * @decision
 * what:     One `Group` per topic, one `Control` per channel plus one for the
 *           bulk-toggle sentinel; locks live in the JSON schema (`readOnly`).
 * why:      The playground renders the grid through its generic form path, so
 *           the field set must exist as a real uischema even though it is
 *           derived at runtime from the lookups.
 * rejected: An empty uischema drawn off `model`/`lookups` by the page (drew
 *           nothing); two controls on one sentinel scope with HIDE rules
 *           (broke every click in the group — bisected, review-notes).
 */
export function useUischema(
  lookups: NotificationsLookups,
  topicIds?: string[]
): UISchemaElement {
  const topics = topicIds
    ? filter(lookups.topics, topic => includes(topicIds, topic.id))
    : lookups.topics;
  const elements = map(topics, topic => {
    const allScope = `#/properties/preferences/properties/${preferenceKey(
      topic.id,
      SELECT_ALL_CHANNEL_ID
    )}`;
    return {
      type: "Group",
      label: topic.name,
      i18n: "field.notification_topic",
      elements: [
        {
          type: "Control",
          scope: allScope,
          label: "All channels",
          i18n: "field.notification_all_channels"
        },
        ...map(lookups.channels, channel => ({
          type: "Control",
          scope: `#/properties/preferences/properties/${preferenceKey(
            topic.id,
            channel.id
          )}`,
          label: channel.name,
          i18n: "field.notification_channel"
        }))
      ]
    };
  });

  return {
    type: "VerticalLayout",
    elements
  } as UISchemaElement;
}

// -----------------------------------------------------------------------------
// Schemas Factory — armless (§D10)

function scopedSchemas(
  _scopeActor: ScopeActorTypes
): Partial<import("./client-notifications.types").NotificationsSchemas> {
  // Empty because this module is armless: no actor has earned a schemas arm
  // (§D10 — the criteria schema and the manager's form are identical for both
  // actors).
  return {};
}

export const createClientNotificationsSchemas = (
  scopeActor: ScopeActorTypes
): import("./client-notifications.types").NotificationsSchemas => ({
  useSchema,
  useUischema,
  ...scopedSchemas(scopeActor)
});

export default createClientNotificationsSchemas;
