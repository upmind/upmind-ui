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
 * (`useClientTicket`). The COLLECTION owns ONE context, `product`
 * (`ADR-001:117,133` names it and grants it to `client`) — the list read
 * about one of my contract products. It is never retargeted at another
 * client: `.for('client', id)` stays forbidden (R1). The MANAGER owns a
 * `ticket` context (R1), because `ADR-001:117,133` names `ticket` a genuine
 * context and a ticket owns its own
 * records (messages) rather than being a leaf. Model types are reused from
 * `@upmind-automation/types`, never re-declared; the derived shapes here are
 * the scope matrices, the criteria model, the feed union and the service
 * surface.
 */

import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { LookupItem } from "../lookup";
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
import type { ComputedRef, Ref } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, two context enums (the collection's and the manager's)
// -----------------------------------------------------------------------------

/**
 * Context types for the COLLECTION — which entity the list is read ABOUT.
 * The context names the ENTITY, not its owner: the owning client falls
 * through the same `resolveClientId` seam as every other call, exactly as
 * {@link TicketContextTypes} does for the manager.
 *
 * `PRODUCT` is spelt `"product"` because that is the member ADR-001's own
 * `ContextType` union already carries (`ADR-001:114` — beside `contract`,
 * `invoice`, `order` and the `ticket` this module's manager uses at `:117`),
 * and `ADR-001:138`'s availability matrix already grants it to the `client`
 * actor (`contract`, `product`, `invoice`, `ticket`). No new vocabulary is
 * minted — the enum binds this module to the platform's word for the thing.
 *
 * It is a RETARGET member (a bare string, never `selector()`): the id is
 * REQUIRED, because the id IS the answer to "which product" (ADR-001
 * amendment 2026-09-15, the retarget/selector split).
 */
export enum TicketsContextTypes {
  /** Reading the tickets raised about one of my contract products (AC-7). */
  PRODUCT = "product"
}

/**
 * @graphify-citation `graphify query "TICKETS_SCOPE_MATRIX"` against
 * `graphify-out/graph.json` (2026-09-15) confirms this is the sole existing
 * declaration — this edit widens the `client` cell, it mints no second
 * matrix.
 *
 * The COLLECTION's scope matrix. `client` resolves to ONE retarget member,
 * {@link TicketsContextTypes.PRODUCT}; `self`, `staff` and `guest` stay
 * `null as never`, so `.for()` is unspellable for every other actor.
 *
 * `.for('client', id)` STAYS FORBIDDEN (R1) and is unrelated to this grant —
 * actor and context are independent axes, and `client` is not a member of
 * this enum. What R1 ruled out was retargeting the list at ANOTHER CLIENT,
 * never the list being read about one of my own products.
 *
 * WHY THE CELL IS NOT EMPTY (the anti-pattern this corrects). The matrix was
 * all-`never` on the reasoning "the collection owns no context". That
 * conflated "may not be retargeted at another client" with "has no contexts
 * at all", and the product RELATIONSHIP — which is what AC-7 narrows on —
 * was left with nowhere to live but a `contract_product_id` filter column
 * beside `reference` and `subject`. A relationship is not an attribute: the
 * platform's first-class home for it is the scope context, so the grant is
 * the fix and the filter column is removed (see {@link TicketsQueryModel}).
 * The WIRE is unchanged — `tickets.services.ts`'s `applyProductScopeFilter`
 * re-spells the context onto `filter[contract_product_id]` at the module's
 * own edge, the same seam `applyStatusCodeFilter` already uses.
 *
 * WHY `client` AND NOT `self`. `ADR-001:136-139`'s availability matrix has no
 * `self` ROW — it lists `guest`, `client` and `staff` and nothing else:
 * `self` resolves to whoever is active (`resolveSelfActor`), and
 * the concrete cell that boots for this module is `client` — the same actor
 * the manager is addressed as (`.as(CLIENT).for(TICKET, id)`). Granting the
 * member to `self` would declare it for `staff` and `guest` too, which
 * ADR-001 does not. A consumer that boots `.as(SELF)` and names no context
 * is untouched.
 */
export const TICKETS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: TicketsContextTypes.PRODUCT,
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
 * free-text term (AC6). `reference` and `subject` are BARE leaf branches —
 * the translator's own rule is that a branch with no nested operator schema
 * emits the bare EQUAL wire key (`filter[reference]=`, D19 — never CONTAINS,
 * never a `|eq` suffix). `created_at` declares its operators explicitly, and
 * only the one actually set reaches the wire (empty values are dropped before
 * the request).
 *
 * `isClosed` is AC1/AC2's headline narrowing as ONE tri-state boolean leaf —
 * `false` is my active tickets, `true` my closed ones, and an ABSENT leaf is
 * "All", the neither-narrowing the collection boots on. It is a boolean and
 * not a status code because the wire needs two DIFFERENT operators for the two
 * positions (`status.code|neq` for active, a bare `status.code` for closed),
 * which no single string leaf can carry; `tickets.services.ts`'s
 * `applyStatusCodeFilter` re-spells the boolean onto whichever operator the
 * position calls for, at the module's own edge.
 *
 * The leaf is deliberately SPELT NOTHING LIKE THE WIRE COLUMN (R9), and the
 * query core never sees it at all: `useModelParser` (`utils/useValidation.ts`)
 * walks the schema's own declared property names and writes each one through a
 * plain lodash `set(result, key, value)`, so a literal `"status.code"` key is
 * read by `set` as the PATH `status.code` and corrupts every commit (proven by
 * instrumented run, `research.md`/`review-notes.md` cycle 6). See
 * `tickets.schemas.ts`'s `useWireQuerySchema` for why the branch is withheld
 * from the translator rather than merely re-spelt beside it.
 *
 * WHAT IS DELIBERATELY NOT HERE. `contract_product_id` used to sit beside
 * `reference` and `subject` as a fourth bare leaf. It is a RELATIONSHIP to
 * another entity, not an attribute of a ticket, and the platform's
 * first-class home for a relationship is the scope context: it is now
 * {@link TicketsContextTypes.PRODUCT}, spelt `.for('product', id)` and
 * re-spelt onto the SAME wire key by `tickets.services.ts`'s
 * `applyProductScopeFilter`. Everything remaining in `filters` is a genuine
 * attribute of a ticket — a reference, a subject, a status, a date.
 */
export type TicketsQueryModel = {
  query?: string;
  filters?: {
    reference?: string;
    subject?: string;
    isClosed?: { eq?: boolean | null };
    created_at?: { gte?: string; lte?: string };
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

/**
 * The manager's merged feed as the actions layer holds it — the entries, the
 * two paging edges and the in-flight flag.
 */
export type TicketFeedState = {
  entries: Ref<TicketFeedEntry[]>;
  hasOlder: Ref<boolean>;
  hasNewer: Ref<boolean>;
  isLoading: Ref<boolean>;
};

/** The manager's reactive single-ticket query, minted once per scope. */
export type TicketItemQuery = SimpleQuery<ITicket, Ticket>;

/**
 * The ticket lookup's criteria model — the quick-search term the control writes
 * and its pagination. `query` is the collection's OWN top-level search branch
 * (`useQuerySchema`), not a `like` filter: it is the one search this API
 * answers for tickets, and the listing's own search box already rides it.
 */
export type TicketLookupQueryModel = {
  query?: string | null;
  sort?: TicketsSortModel;
  pagination?: { limit?: number; offset?: number };
};

/**
 * The ticket lookup handle — a `listInfinite` query whose `select` maps rows to
 * the option shape a lookup control renders, so the control reaches no service
 * of its own.
 */
export type TicketLookupQuery = ListQuery<
  ITicket[],
  LookupItem[],
  TicketLookupQueryModel
>;

/**
 * What a lookup control's `options.lookup.service` carries — a THUNK returning
 * the once-minted {@link TicketLookupQuery}, so the first fetch defers to the
 * control's own read rather than firing at construction.
 */
export type TicketLookupService = () => TicketLookupQuery;

/** The lookups a ticket picker drives. One entry: the ticket itself. */
export type TicketsScopeLookups = {
  ticket: TicketLookupService;
};

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

  /** The picker's lookups, one thunk per pickable record. */
  lookups: TicketsScopeLookups;

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
