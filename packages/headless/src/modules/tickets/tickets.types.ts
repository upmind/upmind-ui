/**
 * @graphify-citation `graphify query "TicketContextTypes TicketsContextTypes
 * TicketScopeMatrix TicketsQueryModel TicketFeedEntry ticket feed"` against
 * `graphify-out/graph.json` (2026-09-14) returns no `packages/headless/src/modules/tickets/*`
 * node at all — the module is net-new (`research.md` G1/V19). The only
 * existing scope/context constructs for tickets are the portal-nuxt mock's
 * `ClientTicketContextTypes` / `ClientTicketsContextTypes` /
 * `ClientTicketScopeMatrix` (`apps/portal-nuxt/app/portal/mock/contracts/client-tickets.ts`)
 * — the surface this module CORRECTS per operator ruling R1, never copies
 * (the mock's collection matrix spells the forbidden `.for('client', id)`).
 * `TicketStatusCodes` (`packages/types/src/data/enums/tickets.ts`) already
 * exists and is reused, never re-declared. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.types
 * @description Types for the client×self support-ticket data layer — the
 * query-backed collection (`useClientTickets`) and the query-backed manager
 * (`useClientTicket`). The COLLECTION owns no context: `ADR-001:117,133`
 * ruling R1 confirms `client` may act for `ticket`, but the collection itself
 * is never retargeted (`.for('client', id)` stays forbidden), so its matrix
 * refuses every actor. The MANAGER owns a `ticket` context (R1), because
 * `ADR-001:117,133` names `ticket` a genuine context and a ticket owns its own
 * records (messages) rather than being a leaf. Model types are reused from
 * `@upmind-automation/types`, never re-declared; the derived shapes here are
 * the scope matrices, the criteria model, the feed union and the service
 * surface.
 */

import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { ListQuery, SimpleQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IBrandTicketDepartment,
  IHookLog,
  ITicket,
  ITicketDepartment,
  ITicketMessage,
  TicketStatusCodes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one context enum (the manager's)
// -----------------------------------------------------------------------------

/**
 * @graphify-citation `graphify query "TICKETS_SCOPE_MATRIX"` against
 * `graphify-out/graph.json` (2026-09-15) confirms this is the sole existing
 * declaration (`L57`) — this is a doc-comment-only correction (R11), no new
 * type is minted.
 *
 * The COLLECTION's scope matrix. Every actor refuses `.for()` — the
 * collection is read `.as(ScopeActorTypes.SELF)` only, and the run
 * constraint forbids `.for('client', id)` outright (R1, confirmed unchanged
 * by R11 — the collection stays `.as(ScopeActorTypes.SELF)` with the
 * all-`never` matrix and no cast). Mirrors the all-`never` construction
 * `client-email-history`'s single read uses for the same reason: no context
 * enum is minted, so nothing is spellable.
 */
export const TICKETS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientTickets` (derived from the runtime const). */
export type TicketsScopeMatrix = typeof TICKETS_SCOPE_MATRIX;

/**
 * Context types for the per-ticket MANAGER — which ticket is being addressed.
 * The context names the ENTITY, not its owner: the owning client falls
 * through the same `resolveClientId` seam as every other call.
 */
export enum TicketContextTypes {
  /** Addressing one existing ticket by id. */
  TICKET = "ticket"
}

/**
 * @graphify-citation see this file's head citation (`graphify-out/graph.json`,
 * 2026-09-14) — no duplicate `TICKET_SCOPE_MATRIX` node exists; this is a
 * doc-comment-only correction (R11), no new type is minted.
 *
 * Scope matrix for `useClientTicket` — RULED R11 (R1's substance stands, its
 * `.as('self')` actor spelling was corrected). `ADR-001:117,133` names
 * `ticket` a context a client may act for; `SINGLE-READ.md`'s `.withId(id)`
 * is overruled for this module because a ticket owns its own records
 * (messages) and is not a leaf. Only `client` resolves; `self`, `staff` and
 * `guest` stay `null as never`, so `.for('ticket', id)` is unspellable for
 * every other actor. `.as(ScopeActorTypes.CLIENT)` is the client actor on
 * their own session — this IS the client×self cell — and is never
 * `.for('client', id)`, which stays forbidden; actor and context are
 * independent axes.
 */
export const TICKET_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: TicketContextTypes.TICKET,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientTicket` (derived from the runtime const). */
export type TicketScopeMatrix = typeof TICKET_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Properties the ticket list can be sorted by (`research.md` §2A-ii AC4). */
export enum TicketsSortableProperties {
  REFERENCE = "reference",
  SUBJECT = "subject",
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at"
}

// -----------------------------------------------------------------------------
// QUERY MODEL (ADR-032 decision 13 — ONE model over query · filters · sort · pagination)
// -----------------------------------------------------------------------------

/** One sort entry — the model's ordered form; precedence is position. */
export type TicketSortEntry = {
  field: TicketsSortableProperties;
  dir: SortDirection;
};

/**
 * @graphify-citation see this file's head citation (graphify-out/graph.json,
 * 2026-09-14) — no prior tickets query-model construct exists; this is new
 * ground, not a duplicate.
 *
 * @graphify-citation `graphify query "TicketsQueryModel statusCode status.code
 * filter translation useModelParser"` against `graphify-out/graph.json`
 * (2026-09-15) confirms `TicketsQueryModel` (`tickets.types.ts:133`) as the
 * only node of its kind — this edit renames an existing field, it mints no
 * new type.
 *
 * The collection's whole request state as one model. `query` is the
 * free-text term (AC6). `reference` / `subject` / `contract_product_id` are
 * BARE leaf branches — the translator's own rule is that a branch with no
 * nested operator schema emits the bare EQUAL wire key (`filter[reference]=`,
 * D19 — never CONTAINS, never a `|eq` suffix). `statusCode` and `created_at`
 * declare their operators explicitly because AC1/AC2 need both `eq` (closed
 * tab) and `neq` (active tab) live on the same property, and only the one
 * actually set reaches the wire (empty values are dropped before the
 * request). `statusCode` is deliberately UNDOTTED (R9): `useModelParser`
 * (`utils/useValidation.ts`) walks the schema's own declared property names
 * and writes each one through a plain lodash `set(result, key, value)` — a
 * literal `"status.code"` key is read by `set` as the PATH `status.code`, not
 * the key `"status.code"`, corrupting every commit regardless of the value
 * supplied (proven by instrumented run, `research.md`/`review-notes.md`
 * cycle 6). `tickets.services.ts`'s `loadList` re-spells the committed value
 * onto the real wire column `status.code` at its own edge (inside `guard`,
 * before the request fires) — the schema and the wire deliberately diverge
 * here, and only here.
 */
export type TicketsQueryModel = {
  query?: string;
  filters?: {
    reference?: string;
    subject?: string;
    statusCode?: { eq?: string; neq?: string };
    created_at?: { gte?: string; lte?: string };
    contract_product_id?: string;
  };
  sort?: TicketSortEntry[];
  pagination?: { limit?: number; offset?: number };
};

export type TicketsFilterModel = NonNullable<TicketsQueryModel["filters"]>;
export type TicketsSortModel = NonNullable<TicketsQueryModel["sort"]>;

/** Boot order — most-recently-updated first (AC4 default, `-updated_at`). */
export const TICKETS_DEFAULT_SORT: TicketSortEntry[] = [
  { field: TicketsSortableProperties.UPDATED_AT, dir: "desc" as SortDirection }
];

/** The collection's query schema — a real Draft-07 schema, walked at runtime. */
export type TicketsQuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// DOMAIN MODELS — reused wire types, passed through by the mappers
// -----------------------------------------------------------------------------

/**
 * The mapped ticket row. `ITicket` already carries the corrected field names
 * (`settings.lock`, `settings.scheduled_datetime`, `is_delegated_object`) the
 * portal mock got wrong (`locked`, `scheduledAt`, `isDelegated`) — no rename
 * is owed here. R4 extends `ITicket` additively with `contract_product` /
 * `contract_product_id` / `invoice`.
 */
export type Ticket = ITicket;

/**
 * The mapped message row (no new type minted — confirmed existing at
 * graphify-out/ `TicketMessage tickets.types.ts:178`). `can_manage`,
 * `deleted_at` and `client_actor_id` are already the corrected field names
 * (AC-PM). `isDeleted` is a derived convenience boolean read off `is_log`
 * (Q5, `research.md` §11, resolved by the recorded withdrawal fixture T2 —
 * the wire never populates `deleted_at`).
 */
export type TicketMessage = ITicketMessage & { isDeleted: boolean };

/** One status-log row, mapped from `IHookLog` for the merged feed (AC22). */
export type TicketStatusLog = IHookLog & { statusCode?: TicketStatusCodes };

/**
 * The merged feed AC22 renders — messages and status-log rows in one ordered
 * sequence, discriminated by `kind`.
 */
export type TicketFeedEntry =
  | { kind: "message"; message: TicketMessage }
  | { kind: "log"; log: TicketStatusLog };

/**
 * The `POST api/ticket_messages/files` upload-response row (FE-3226 R12
 * capture receipt, `tickets.services.ts:603`) — recorded RICHER than the
 * legacy `{id,hash}` reduction: the live row carries 26 fields, `hash`
 * included (R14 — corrects R12's truncated-probe misreading; `hash` was
 * never absent, only unmodeled). This type models the subset the module
 * consumes; it is a deliberate narrowing, not a claim that the wire row
 * has only these members. `graphify query "TicketAttachmentRef"` against
 * `graphify-out/graph.json` (2026-09-15) confirms this is the sole existing
 * declaration (`L214`), so this is a correction, not a new type.
 * `packages/types`' `ITicketMessagePayload.files` stays the separate
 * request-side `{id,hash}` shape (`research.md` Q10) — this type is the
 * response only, never forced into that request shape or the reverse.
 */
export type TicketAttachmentRef = {
  id: string;
  type: string;
  mime_type: string;
  object_type: string;
  object_class: string;
  object_id: string | null;
  name: string;
};

/** One selectable desk option for the create form (Z7 — keyed on `ticket_department_id`, never `id`). */
export type TicketDepartmentOption = {
  value: ITicketDepartment["id"];
  label: string;
  isDefault: boolean;
};

/** The two lookup shapes AC31 exposes — brand-public desks and all desks. */
export type TicketDepartmentLookups = {
  brandDepartments: IBrandTicketDepartment[];
  departments: ITicketDepartment[];
};

// -----------------------------------------------------------------------------
// FORM MODELS (R8 — the module exports model/schema/uischema; the page validates)
// -----------------------------------------------------------------------------

/**
 * AC9 — the create-ticket form model. `body` is optional (R17(b)) — the
 * server requires it only when `files` is absent; `useCreateSchema()`
 * enforces the same conditional. `graphify query "TicketCreateModel"`
 * against `graphify-out/graph.json` (2026-09-15) confirms this is the
 * sole existing declaration — a correction, not a new type.
 */
export type TicketCreateModel = {
  subject: string;
  body?: string;
  ticketDepartmentId?: string | null;
  contractProductId?: string | null;
  scheduledAt?: string | null;
  files?: TicketAttachmentRef[];
};

/** AC27 — the change-subject form model. */
export type TicketSubjectModel = { subject: string };

/** AC18 — the edit-own-message form model. */
export type TicketMessageEditModel = { body: string };

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/** The collection's reactive list query, minted once per scope. */
export type TicketsListQuery = ListQuery<
  ITicket[],
  Ticket[],
  TicketsQueryModel
>;

/** The manager's reactive single-ticket query, minted once per scope. */
export type TicketItemQuery = SimpleQuery<ITicket, Ticket>;

/**
 * The contract `createTicketsServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager can never disagree about whose
 * tickets are being read (`design.md` § "The one services factory").
 */
export type TicketsServices = {
  queryKey: QueryKey;
  clientId: ComputedRef<string | undefined>;
  brandId: ComputedRef<string | undefined>;
  isAvailable: ComputedRef<boolean>;
  error: ComputedRef<ResponseError | undefined>;

  loadList: () => TicketsListQuery;
  loadOne: (ticketId?: string) => TicketItemQuery;
  createTicket: (body: Record<string, unknown>) => Promise<Ticket>;
  updateTicket: (
    ticketId: string,
    patch: Record<string, unknown>
  ) => Promise<Ticket>;
  setStatus: (ticketId: string, statusCode: string) => Promise<Ticket>;

  loadMessages: (
    ticketId: string,
    params: { before?: string; after?: string; limit?: number }
  ) => Promise<{ rows: TicketMessage[]; hasMore: boolean }>;
  loadMessage: (ticketId: string, messageId: string) => Promise<TicketMessage>;
  postReply: (
    ticketId: string,
    payload: Record<string, unknown>
  ) => Promise<TicketMessage | undefined>;
  editReply: (
    ticketId: string,
    replyId: string,
    body: Record<string, unknown>
  ) => Promise<TicketMessage>;
  deleteMessage: (
    ticketId: string,
    messageId: string,
    reason: string
  ) => Promise<void>;
  deleteFile: (
    ticketId: string,
    messageId: string,
    fileId: string
  ) => Promise<void>;
  downloadFile: (fileId: string) => Promise<ArrayBuffer>;

  loadStatusLogs: (ticketId: string) => Promise<TicketStatusLog[]>;
  uploadFile: (file: File) => Promise<TicketAttachmentRef>;

  loadBrandDepartments: () => Promise<IBrandTicketDepartment[]>;
  loadDepartments: () => Promise<ITicketDepartment[]>;
  loadTicketStatuses: () => Promise<
    { code: TicketStatusCodes; name: string }[]
  >;

  saveSupportPrefs: (
    prefs: Partial<TicketSupportPrefs>
  ) => Promise<TicketSupportPrefs>;
};

/**
 * AC33 (R7) — the two client-owned support prefs plus the AC3 page size.
 * `ui/support/messageSignature` (FE-1931's key) is preserved by the
 * read-modify-write but never exposed here.
 */
export type TicketSupportPrefs = {
  submitWithShortcut: boolean;
  newLineKey: "enter" | "shift+enter";
  limit: number;
};

/** Attachment size ceiling (AC23, `research.md` §2A-ii). */
export const TICKET_ATTACHMENT_MAX_BYTES = 26214399;
