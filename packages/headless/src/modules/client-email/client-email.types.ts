/**
 * @graphify-citation `graphify query "client email"` (2026-08-05) — the only
 * `Email` / `EmailModel` / `ClientEmail*` nodes in `graphify-out/graph.json`
 * belong to the superseded `client-email/` tree (deleted 2026-08-05; receipt
 * in git history); `client-email-history/` carries a distinct `SentEmail*`
 * family. No live duplicate to consume, so minting here is warranted. See
 * `graphify-out/GRAPH_REPORT.md`.
 *
 * `graphify query "client email addressable isAvailable predicate"`
 * (2026-08-05) — the graph's only addressability node is
 * `isAddressable() [client-email.services.ts L87]`; no shared predicate type or
 * utility exists to consume, so `ClientEmailServices.isAvailable` below exposes
 * that one function reactively rather than minting a parallel construct.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.types
 * @description Types for a client's own email addresses — the query-backed
 * collection (`useClientEmails`) and the `dataManagerMachine`-backed per-email
 * form editor (`useClientEmailManager`). Each composable owns its own context
 * enum and scope matrix; the email model, the services contract and the
 * mappers are shared, which is what keeps ONE identity seam for both halves.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery, QueryParams, QueryProps } from "../query";
import type { QueryKey } from "@tanstack/vue-query";
import type { IEmail } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { JsonSchema7 } from "@jsonforms/core";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the email COLLECTION — whose list is being addressed.
 */
export enum ClientEmailsContextTypes {
  /** Acting on a client's email collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientEmails`. `client` is the only actor that resolves;
 * `staff` and `guest` are `null as never`, which makes `.as('staff')` a
 * compile-time error rather than an advertised-but-absent capability.
 */
export const CLIENT_EMAILS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientEmailsContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientEmails` (derived from the runtime const). */
export type ClientEmailsScopeMatrix = typeof CLIENT_EMAILS_SCOPE_MATRIX;

/**
 * Context types for the per-email MANAGER — which email is being edited. The
 * context names the ENTITY, not its owner: the owning client falls through the
 * same `resolveClientId` seam as every other call.
 */
export enum ClientEmailContextTypes {
  /** Editing one existing email by id. */
  EMAIL = "email"
}

/**
 * Scope matrix for `useClientEmailManager`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const CLIENT_EMAIL_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientEmailContextTypes.EMAIL,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientEmailManager` (derived from the runtime const). */
export type ClientEmailScopeMatrix = typeof CLIENT_EMAIL_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/** Predefined email categories, keyed by the API's `type` field. */
export const EmailTypes = [{ key: 1, value: "Account" }];

/** The form/request model for an email address. */
export type EmailModel = {
  /** Present when editing an existing email. */
  id?: IEmail["id"];
  /** The email address, or `null` when unset. */
  email: IEmail["email"] | null;
};

/** An email address as read from the API, with its display and status fields. */
export type Email = EmailModel & {
  /** Display title — the address itself. */
  title: string;
  /** Display description. */
  description: string;
  /** The API's email category; see {@link EmailTypes}. */
  type: IEmail["type"];
  /** When the address last bounced, formatted and relative. */
  bouncedAt?: {
    date?: string | null;
    relative?: string | null;
  };
  /** Status flags for UI rendering. */
  meta: {
    /** `true` if this is the client's default address. */
    isDefault: boolean;
    /** `true` if the API permits deleting this address. */
    canDelete: boolean;
    /** `true` if the address has been verified. */
    isVerified: boolean;
    /** `true` if mail to this address has bounced. */
    isBounced: boolean;
  };
};

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model (S-D9)
// -----------------------------------------------------------------------------
//
// @graphify-citation `graphify query "client email query filter sort model"`
// (2026-08-06) — no `QueryModel` / `FilterModel` / `SortModel` / `QuerySchema`
// node in `graphify-out/graph.json`; the query platform's `QueryProps` /
// `RequestFilters` describe the WIRE shape, this describes the schema-validated
// MODEL. No live duplicate to consume, so minting here is warranted.

/** One filter operator a client-email column declares (S-D1). */
export type FilterOperator = "like" | "eq";

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value, S-D1), `sort` (ordered, precedence = position) and `pagination`. This
 * is the instance validated against `useQuerySchema()`; the translator maps it
 * to the `QueryProps` the query layer already accepts. No `query` member: this
 * endpoint does not honour a search term, so the search box binds
 * `filters.email.like` (A-D5 finding 9 / Task 39).
 */
export type QueryModel = {
  filters?: {
    email?: { like?: string };
    verified?: { eq?: boolean };
    bounced?: { eq?: boolean };
    default?: { eq?: boolean };
  };
  sort?: SortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/**
 * One sort entry. Declared STRUCTURALLY identical to the harness's
 * `TableModel["sort"]` member rather than imported from it — `packages/headless`
 * has no `@upmind-automation/scenario-harness` dependency and adding that edge
 * would invert the dependency direction. The compile-time bridge is the
 * playground's channel builder, whose `satisfies TableModel["sort"]` reds on
 * drift.
 */
export type SortEntry = { field: string; dir: "asc" | "desc" };

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, and the translator/validators walk it at runtime, so the
 * type stays general rather than a module-specific literal (see the `@decision`
 * adjacent to `useQuerySchema` for why `as const` is not used).
 */
export type QuerySchema = JsonSchema7;

/**
 * The whole query model → the `QueryProps` the query layer already accepts
 * (`query.types.ts`). Re-exported on the services contract below so there is
 * exactly one translator implementation (S-D9).
 */
export type TranslateQuery = (model: QueryModel) => QueryProps;

/** The manager's machine context — the shared machine's, over this form model. */
export type EmailContext = DataManagerContext<EmailModel>;

/**
 * The reactive list query, minted ONCE per scope in `useClientEmails.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`.
 */
export type ClientEmailListQuery = ListQuery<IEmail[], Email[]>;

/** Lands a failed collection mutation in the services instance's error state. */
export type ClientEmailErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientEmailServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager address the same client through
 * the same seam.
 */
export type ClientEmailServices = {
  /** The module's base cache key; a save invalidates it and the list refetches. */
  queryKey: QueryKey;
  /**
   * The target client this scope resolved. The manager seeds its machine
   * context from here rather than re-reading the session.
   */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate in
   * `client-email.services` calls. The composable layers read THIS rather than
   * re-deriving the expression, so the flag a consumer renders and the gate the
   * wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed collection mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  loadList: (
    params?: Partial<QueryParams<IEmail[], Email[]>>
  ) => ClientEmailListQuery;
  /** Per-email read; seeds the manager when no collection is loaded. */
  loadOne: (id?: IEmail["id"]) => Promise<Email | undefined>;
  add: (model: EmailModel) => Promise<IEmail | undefined>;
  update: (id: IEmail["id"], model: EmailModel) => Promise<IEmail | undefined>;
  /** Find-or-create; backs both the collection action and the machine's `add`. */
  ensure: (model: EmailModel) => Promise<Email>;
  remove: (id: IEmail["id"]) => Promise<void>;
  setDefault: (id: IEmail["id"]) => Promise<IEmail | undefined>;
  verify: (id: IEmail["id"]) => Promise<void>;
  /** Schema validation; rejects with the AJV errors as the error's `data`. */
  validate: (model?: EmailModel) => Promise<EmailModel | undefined>;
  /** Invalidates {@link ClientEmailServices.queryKey} so the collection refetches. */
  refresh: () => Promise<void>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes on
 * entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientEmailManagerMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (context: EmailContext) => Promise<Partial<EmailContext>>;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: EmailContext,
    event: AnyEventObject
  ) => Promise<Partial<EmailContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: EmailContext) => Promise<EmailModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: EmailContext) => Promise<Email>;
  /** `processing.updating` — reached when context already carries an id. */
  update: (context: EmailContext) => Promise<IEmail | undefined>;
};
