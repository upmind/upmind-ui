/**
 * @graphify-citation `graphify query "client email history sent email
 * received emails"` against `graphify-out/graph.json` (2026-08-06) returns
 * exactly `SentEmail`, `SentEmailModel`, `SentEmailContext`, `SentEmailStatus`,
 * `ReceivedEmailsSortableProperties`, `ReceivedEmails`, `ReceivedEmailsProps`,
 * `ReceivedEmailsSortProps`. `SentEmail` / `SentEmailModel` /
 * `SentEmailStatus` / `ReceivedEmailsSortableProperties` already exist and are
 * consumed, never re-minted. `ReceivedEmailItemQuery` aliases the platform's own
 * `SimpleQuery` — the criteria-bearing single-read handle — the same way
 * `ReceivedEmailsListQuery` aliases `ListQuery`, never from `ReturnType<typeof
 * loadOne>`. The query-model family (`SentEmailQueryModel`,
 * `SentEmailSortEntry`, `SentEmailQuerySchema`, `SENT_EMAIL_DEFAULT_SORT`) is
 * new ground here, minted the same way the `client-email` sibling's cited
 * `QueryModel` family was — no prior node. See `graphify-out/GRAPH_REPORT.md`.
 *
 * The graph answering "no such construct exists" is licence to mint a NAME, not
 * licence to mint a CONCEPT. A `ReceivedEmailContextTypes.EMAIL` was minted here
 * on exactly that reading and has been removed (FE-3095): a scope context names
 * an entity the actor ACTS UPON — ADR-001's set is `client`, `lead`,
 * `contract`, `invoice`, `order`, `ticket`, all large entities — and a leaf
 * record was never one. The single read marks its record with the builder's
 * `.withId(id)` instead. An absent context enum is now the ANSWER for a
 * single-record read, not a gap to fill.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/client-email-history.types
 * @description Types for a client's own email history — the query-backed
 * collection (`useClientReceivedEmails`) and the query-backed single read
 * (`useClientReceivedEmail`). The COLLECTION owns a context ENUM and a matrix
 * that resolves one cell, because whose history is read is a genuine actor
 * context. The SINGLE READ owns NO context enum — which email is read is a
 * record id (`.withId(id)`), not a context — but it still owns a matrix, an
 * ALL-`never` one, because that is the only construct that makes `.for()`
 * unspellable. The email model, the services contract and the mapper are
 * shared, which is what keeps ONE identity seam for both halves. The module has
 * no mutation surface (no form, no schema layer, no state machine).
 *
 * No new construct here — see this file's head `graphify-out/` citation.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { ListQuery, SimpleQuery } from "../query";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClient, IImage, ISentEmail } from "@upmind-automation/types";
import type { SentEmailStatus } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one context enum
//
// The collection's matrix resolves a cell. The single read's matrix refuses
// EVERY cell: it has no context enum, because it marks its record with
// `.withId(id)`, and an all-`never` matrix is what keeps `.for()` unspellable
// while the enum is gone. See this file's head `graphify-out/` citation.
// -----------------------------------------------------------------------------

/**
 * Context types for the email-history COLLECTION — whose history is read.
 */
export enum ReceivedEmailsContextTypes {
  /** Reading a client's own email-history collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientReceivedEmails`. `client` is the only actor with a
 * context; `staff`, `guest` and `self` are `null as never`.
 *
 * A cell governs `.for()` ONLY. A `null as never` cell withdraws `.for()` for
 * that actor — it does NOT make `.as(actor)` a compile error, because
 * `as<TActor extends ScopeActorTypes>` carries no matrix constraint. So this
 * matrix says: staff may name itself, and may not RETARGET this read at another
 * client.
 *
 * That refusal is deliberate. The oracle DOES support a staff read of a
 * client's history (`list_client_email_history` over
 * `GET api/admin/clients/{id}/email_history`); this module implements one
 * self-shaped endpoint and no actor branch, and FE-3095 deliberately did not
 * add the staff path — an operator-ruled drop, carried as the
 * `Dropped-with-Linear-issue` parity row in `useClientReceivedEmails.ts`'s own
 * `@decision`. The cell states what the shipped code does, never what the wire
 * can do.
 *
 * No new construct here — see this file's head `graphify-out/` citation.
 */
export const RECEIVED_EMAILS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ReceivedEmailsContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientReceivedEmails` (derived from the runtime const). */
export type ReceivedEmailsScopeMatrix = typeof RECEIVED_EMAILS_SCOPE_MATRIX;

/**
 * Scope matrix for `useClientReceivedEmail` — the SINGLE read. Every actor is
 * `null as never`, the same construction `RECEIVED_EMAILS_SCOPE_MATRIX` above
 * uses for the actors it refuses, so `.for(type, id)` is a compile-time error
 * for all four. A leaf record is marked with `.withId(id)` and is never a scope
 * context (FE-3095); the wide `ActorContextMatrix` default widened every
 * context to `string`, which let `.for("email", id)` keep type-checking once
 * the `EMAIL` context type was deleted.
 *
 * Its TYPE is passed as `createScopedComposable`'s `TMatrix`; the VALUE is not
 * passed as the third (runtime) argument, so no matrix reaches the registry for
 * this read — the same way the sibling collection declares its own. Dropping the
 * type argument is what re-opens `.for()`, so it is not optional paperwork.
 * Not re-exported from the module barrel: it names no context a consumer can
 * spell. See `graphify-out/GRAPH_REPORT.md`.
 */
export const RECEIVED_EMAIL_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientReceivedEmail` (derived from the runtime const). */
export type ReceivedEmailScopeMatrix = typeof RECEIVED_EMAIL_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/**
 * Properties by which the email history can be sorted. Moved here from
 * `useClientReceivedEmails.ts` (types live in `*.types.ts`); members and
 * string values are unchanged — four `client-vue` importers depend on them by
 * name.
 */
export enum ReceivedEmailsSortableProperties {
  DEFAULT = "created_at",
  SUBJECT = "subject"
}

// -----------------------------------------------------------------------------
// QUERY MODEL
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value), `sort` (ordered, precedence = position) and `pagination`. This is the
 * instance validated against `useQuerySchema()`; the query layer's translator
 * maps it to the wire triple. No `query` member: this endpoint honours no
 * free-text term, so the search box binds `filters.subject.like`.
 */
export type SentEmailQueryModel = {
  filters?: {
    subject?: { like?: string };
    sent?: { eq?: boolean };
    bounced?: { eq?: boolean };
    error_id?: { neq?: string };
    /** @see graphify-out/ FE-3101 — extends existing filters, not a new type */
    created_at?: { gte?: string; lte?: string };
  };
  sort?: SentEmailSortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * The nested filter model — the `filters` branch of {@link SentEmailQueryModel}.
 * A projection of the already-minted model (top-of-file `graphify-out/`
 * citation), the same way the `client-email` sibling projects `FilterModel`.
 */
export type SentEmailFilterModel = NonNullable<SentEmailQueryModel["filters"]>;

/** One sort entry — the MODEL's ordered form; precedence is position. */
export type SentEmailSortEntry = { field: string; dir: SortDirection };

/** The ordered sort model — the `sort` branch of {@link SentEmailQueryModel}. */
export type SentEmailSortModel = NonNullable<SentEmailQueryModel["sort"]>;

/**
 * The BOOT order — newest first (`order=-created_at` on the wire). Declared as
 * the query schema's `sort` default, so an emptied sort refills itself on the
 * next parse. This is the boot state only: a user sort replaces the whole
 * model.
 */
export const SENT_EMAIL_DEFAULT_SORT: SentEmailSortEntry[] = [
  { field: "created_at", dir: SortDirection.DESC }
];

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, walked at runtime by the translator/validators, so the type
 * stays general rather than a module-specific literal.
 */
export type SentEmailQuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * Interface representing the data model for an email address, suitable for forms
 * or API payloads.
 */
export interface SentEmailModel {
  /**
   * Optional unique identifier for the email address. Present if editing an existing email.
   */
  id?: ISentEmail["id"];
}

/**
 * Interface representing a comprehensive email object, extending {@link SentEmailModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for email addresses retrieved from the API or displayed in the UI.
 */
export interface SentEmail extends SentEmailModel {
  //--- identifier
  /**
   * The unique identifier for the email address.
   */
  id: ISentEmail["id"];
  /**
   * The body content of the email address.
   */
  body: string;
  /**
   * The sender of the email.
   */
  from: ISentEmail["from"];
  //--- computed details
  /**
   * The subject line of the email address.
   */
  subject: ISentEmail["subject"];
  /**
   * The recipient(s) of the email.
   */
  to: ISentEmail["to"];
  /**
   * CC recipients, shown in the read-only detail (legacy `viewEmailModal` cc
   * field). New member of the already-cited `SentEmail` — `graphify-out/` graph
   * query returned no separate cc construct.
   */
  cc: ISentEmail["cc"];
  /**
   * The date and time when the email was sent.
   */
  dateBounced: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The date and time when the email errored.
   */
  dateErrored: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The date and time when the email was sent.
   */
  dateSent: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The status-appropriate display date — sent_at when sent, bounced_at when
   * bounced, updated_at when errored, null while still sending. Parity with the
   * legacy emailHistory table, which shows the date BY STATUS, never a bare
   * created_at column. New MEMBERS of the already-cited `SentEmail` (top-of-file
   * `graphify-out/` citation confirms no separate display-date type exists).
   */
  date: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The record's created/queued date (`order=-created_at`) — the field the list
   * SORTS and FILTERS by. Not a displayed list column in the oracle
   * (`graphify-out/` graph query: no prior `dateCreated` construct).
   */
  dateCreated: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The current status of the email address.
   */
  status: SentEmailStatus;
  /**
   * Information about the recipient of the email.
   */
  recipient: {
    name: IClient["fullname"];
    email: IClient["email"];
    imageUrl: IImage["full_url"];
  };
  // --- meta info
  /**
   * Meta-information about the email address's status and capabilities.
   */
  meta: {
    /**
     * `true` if there was an issue delivering the email.
     */
    isBounced: boolean;
    /**
     * `true` if there was an error sending the email.
     */
    isError: boolean;
    /**
     * `true` if the email was sent successfully.
     */
    isSent: boolean;
  };
}

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useClientReceivedEmails.ts`.
 * Aliased from the query platform's own `ListQuery`, parameterised by this
 * module's {@link SentEmailQueryModel} — never derived with
 * `ReturnType<typeof localServiceFn>`. The handle publishes `criteria` /
 * `schema` / `isFiltered` / `criteriaError` / `setCriteria`, so every layer
 * below reads THAT one source and never a shadow copy.
 */
export type ReceivedEmailsListQuery = ListQuery<
  ISentEmail[],
  SentEmail[],
  SentEmailQueryModel
>;

/**
 * The reactive single-item query, minted ONCE per scope in
 * `useClientReceivedEmail.ts`. Aliases the platform's own `SimpleQuery` — the
 * criteria-bearing single-read handle — the same way
 * {@link ReceivedEmailsListQuery} aliases `ListQuery`, never from
 * `ReturnType<typeof loadOne>`.
 */
export type ReceivedEmailItemQuery = SimpleQuery<ISentEmail, SentEmail>;

/**
 * The contract `createClientEmailHistoryServices` resolves to — consumed by
 * BOTH halves, so the collection and the single read address the same client
 * through the same seam.
 */
export type ClientEmailHistoryServices = {
  /** The module's base cache key. */
  queryKey: QueryKey;
  /**
   * The target client this scope resolved. Neither request-issuing function
   * re-derives it independently.
   */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate
   * in `client-email-history.services.ts` calls. The composable layers read
   * THIS rather than re-deriving the expression, so the flag a consumer
   * renders and the gate the wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /**
   * Present for four-layer shape uniformity; always `undefined` today — the
   * module has no mutations to capture.
   */
  error: ComputedRef<ResponseError | undefined>;
  /**
   * The collection's list query. Takes NOTHING: the request state is the
   * declared query schema, handed to `list({ criteria })`, so there is no
   * params back door a caller could contradict it through.
   */
  loadList: () => ReceivedEmailsListQuery;
  loadOne: (emailId?: SentEmail["id"]) => ReceivedEmailItemQuery;
};
