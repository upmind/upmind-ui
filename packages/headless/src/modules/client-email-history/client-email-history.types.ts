/**
 * @graphify-citation `graphify query "client email history sent email
 * received emails"` against `graphify-out/graph.json` (2026-08-06) returns
 * exactly `SentEmail`, `SentEmailModel`, `SentEmailContext`, `SentEmailStatus`,
 * `ReceivedEmailsSortableProperties`, `ReceivedEmails`, `ReceivedEmailsProps`,
 * `ReceivedEmailsSortProps`. There is no `ReceivedEmailsContextTypes`, no
 * `ReceivedEmailContextTypes`, no `*_SCOPE_MATRIX` for this module — so each
 * construct minted below is new ground, not a duplicate of something already
 * exposed. `SentEmail` / `SentEmailModel` / `SentEmailStatus` /
 * `ReceivedEmailsSortableProperties` already exist and are consumed, never
 * re-minted. `ReceivedEmailItemQuery` aliases the platform's own `SimpleQuery`
 * — the criteria-bearing single-read handle — the same way
 * `ReceivedEmailsListQuery` aliases `ListQuery`, never from `ReturnType<typeof
 * loadOne>`. The query-model family (`SentEmailQueryModel`,
 * `SentEmailSortEntry`, `SentEmailQuerySchema`, `SENT_EMAIL_DEFAULT_SORT`) is
 * new ground here, minted the same way the `client-email` sibling's cited
 * `QueryModel` family was — no prior node. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/client-email-history.types
 * @description Types for a client's own email history — the query-backed
 * collection (`useClientReceivedEmails`) and the query-backed single read
 * (`useClientReceivedEmail`). Each composable owns its own context enum and
 * scope matrix; the email model, the services contract and the mapper are
 * shared, which is what keeps ONE identity seam for both halves. The module
 * has no mutation surface (no form, no schema layer, no state machine).
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
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the email-history COLLECTION — whose history is read.
 */
export enum ReceivedEmailsContextTypes {
  /** Reading a client's own email-history collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientReceivedEmails`. `client` is the only actor that
 * resolves; `staff` and `guest` are `null as never`, which makes
 * `.as('staff')` a compile-time error rather than an advertised-but-absent
 * capability (there is no `clients/{id}/email_history` endpoint in the oracle
 * for a staff actor to be given).
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
 * Context types for the SINGLE read — which email is being read. The context
 * names the ENTITY, not its owner: the owning client falls through the same
 * `resolveClientId` seam as every other call.
 */
export enum ReceivedEmailContextTypes {
  /** Reading one existing email by id. */
  EMAIL = "email"
}

/**
 * Scope matrix for `useClientReceivedEmail`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const RECEIVED_EMAIL_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ReceivedEmailContextTypes.EMAIL,
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
