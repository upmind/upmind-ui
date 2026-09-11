// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-tickets
 * @description Four-layer contract for the `client-tickets` module headless
 * does not have yet (plan §3): the ticket collection (`useClientTickets`) and
 * the per-ticket manager (`useClientTicket`). Rows are the wire `ITicket`;
 * messages and departments are `ITicketMessage` / `ITicketDepartment`.
 * Attachments are NAMED rather than uploaded (plan F9, gap doc X10).
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the tickets
 * listing and its filter set (`src/data/filters/tickets.ts`), the ticket
 * detail with its manage-ticket actions and related-product panel; gap-doc
 * rows "5. Support", X1.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  IClientDelegate,
  IContractProduct,
  ITicket,
  ITicketDepartment,
  ITicketMessage,
  TicketStatusCodes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/** What the new-ticket form writes — legacy's `ticketForm` fields, in model spelling. */
export type TicketModel = {
  subject: ITicket["subject"];
  /** The desk it goes to; a brand with one desk asks nobody to choose it. */
  departmentId?: ITicketDepartment["id"];
  /** The product it is about, when it is about one. */
  productId?: IContractProduct["id"];
  /** The first message on the thread. */
  body: ITicketMessage["body"];
  /** The files named on that message — names only, never content (plan F9). */
  attachments?: string[];
  /**
   * When the client asked the thread to open, where the brand lets them ask —
   * legacy's `scheduled_datetime`, carried only under `canScheduleTicket`.
   */
  scheduledAt?: string;
};

/**
 * What the reply composer writes — legacy's `ticketMessageForm`, whose post
 * carried the message and the files chosen beside it.
 */
export type TicketReplyModel = {
  body: ITicketMessage["body"];
  /** The files named on the reply — names only, never content (plan F9). */
  attachments?: string[];
};

/**
 * Which key starts a NEW LINE in the reply box — legacy's `NewLine` enum,
 * whose picker `supportPreferencesModal.vue:6-12` offered to every actor.
 * The key that SENDS is the other one, and only while the shortcut is on.
 */
export const NEW_LINE_KEY = {
  /** Enter starts a new line; Shift and Enter send. */
  ENTER: "enter",
  /** Shift and Enter start a new line; Enter sends. */
  SHIFT_ENTER: "shift-enter"
} as const;

export type NewLineKey = (typeof NEW_LINE_KEY)[keyof typeof NEW_LINE_KEY];

/**
 * What the composer's post-options form writes — legacy's
 * `supportPreferencesModal`, narrowed to its CLIENT half: the new-line picker
 * and the shortcut question. Only the message signature was staff-only.
 */
export type SupportPreferencesModel = {
  /** Whether a key sends the reply at all, or only the control does. */
  submitWithShortcut: boolean;
  /** Which key starts a new line; the other one sends. */
  newLineKey: NewLineKey;
};

/** What the post-options form is handed — what the keys do today. */
export type SupportPreferencesContext = {
  readonly submitWithShortcut: boolean;
  readonly newLineKey: NewLineKey;
};

/**
 * What the message-edit form writes — legacy's inline editor on a message the
 * client wrote (`ticketMessage.vue:12-34`), which asked for the body and
 * nothing else.
 */
export type TicketMessageModel = {
  body: ITicketMessage["body"];
};

/** What the message-edit form opens on — the message as it reads now. */
export type TicketMessageContext = {
  readonly body: ITicketMessage["body"];
};

/** What the edit-subject form writes — the one field legacy's modal carried. */
export type TicketSubjectModel = {
  subject: ITicket["subject"];
};

/**
 * What the related-product form writes — the one product legacy's
 * `SelectContractProductsModal` came back with (single-select, `isMultiselect`
 * false), which the provider then wrote to the thread's
 * `contract_product_id`.
 */
export type TicketRelatedProductModel = {
  productId: IContractProduct["id"];
};

/**
 * What the related-product schema is handed — the products this client may
 * name, and the one the thread already names where it names one (the picker
 * opened on it as its selection).
 */
export type TicketRelatedProductContext = {
  readonly products: readonly Pick<IContractProduct, "id" | "name">[];
  /** The thread's current product; absent is legacy's "add" side of the control. */
  readonly productId?: IContractProduct["id"];
};

/**
 * What the new-ticket schema is handed — the desks and the products this
 * client may name, and the product they arrived about where they did
 * (`/support/tickets/new?product=`).
 */
export type TicketFormContext = {
  /** The desks the brand publishes; one means the form offers no choice. */
  readonly departments: readonly Pick<ITicketDepartment, "id" | "name">[];
  /** The client's own products — legacy's related-product picker. */
  readonly products: readonly Pick<IContractProduct, "id" | "name">[];
  /** The product the assistance link named, when the client followed one. */
  readonly productId?: IContractProduct["id"];
  /**
   * Whether the brand lets a client book when the thread opens — legacy's
   * `canScheduleTicket`, off the brand's own config.
   */
  readonly canSchedule: boolean;
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the ticket COLLECTION — whose tickets are read. */
export const ClientTicketsContextTypes = {
  /** Reading a client's own tickets. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientTicketsContextTypes =
  (typeof ClientTicketsContextTypes)[keyof typeof ClientTicketsContextTypes];

/**
 * Scope matrix for `useClientTickets`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_TICKETS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientTicketsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientTickets`. */
export type ClientTicketsScopeMatrix = typeof CLIENT_TICKETS_SCOPE_MATRIX;

/** Context types for the per-ticket MANAGER — which ticket is addressed. */
export const ClientTicketContextTypes = {
  /** Acting on one existing ticket by id. */
  TICKET: "ticket"
} as const;

export type ClientTicketContextTypes =
  (typeof ClientTicketContextTypes)[keyof typeof ClientTicketContextTypes];

/** Scope matrix for `useClientTicket`. Separate from the collection's. */
export const CLIENT_TICKET_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientTicketContextTypes.TICKET,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientTicket`. */
export type ClientTicketScopeMatrix = typeof CLIENT_TICKET_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the ticket list can be sorted by. */
export const ClientTicketsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  DATE_UPDATED: "updated_at",
  STATUS: "status_id"
} as const;

export type ClientTicketsSortableProperties =
  (typeof ClientTicketsSortableProperties)[keyof typeof ClientTicketsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — one per legacy filter control. */
export type ClientTicketsFilters = {
  /** Narrows by ticket reference. */
  reference: (value?: ITicket["reference"]) => void;
  /** Narrows by subject line. */
  subject: (value?: ITicket["subject"]) => void;
  /** Narrows to one department. */
  department: (value?: ITicketDepartment["id"]) => void;
  /** Narrows to one status — the open/closed tabs ride this. */
  status: (value?: TicketStatusCodes) => void;
  /**
   * Narrows by the day the thread was raised — legacy's `CreatedAtFilter`
   * (`data/filters/tickets.ts:72-76`).
   */
  dateCreated: (value?: ITicket["created_at"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientTickets (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of tickets and its lookups. */
export type UseClientTicketsContext = {
  /** The reactive current page of this scope's tickets (always an array). */
  data: ComputedRef<ITicket[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one ticket on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<ITicket>>["findOne"];
  /** Finds one ticket on the page by id. */
  getOne: ReturnType<typeof useCollection<ITicket>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientTicketsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no tickets. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls, the new-ticket write, and lifecycle. */
export type UseClientTicketsActions = {
  /** Opens a thread, resolving the ticket the desk recorded. */
  create: (model: TicketModel) => Promise<ITicket | undefined>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientTicketsFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: ClientTicketsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientTicketsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientTicket (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed ticket and everything its detail renders. */
export type UseClientTicketContext = {
  /** The ticket this scope resolved. */
  data: ComputedRef<ITicket | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The conversation, oldest first. */
  messages: ComputedRef<ITicketMessage[]>;
  /** The department the ticket was raised with. */
  department: ComputedRef<ITicketDepartment | undefined>;
  /** The product this ticket is about, when one is related. */
  relatedProduct: ComputedRef<IContractProduct | undefined>;
};

/** Manager meta — one computed per state flag. */
export type UseClientTicketMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no ticket. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True once the ticket is closed — the composer hides on this. */
  isClosed: ComputedRef<boolean>;
  /** True while the ticket is locked to further replies. */
  isLocked: ComputedRef<boolean>;
  /** True while the ticket reached this client through a delegation. */
  isDelegated: ComputedRef<boolean>;
  /** True while the client may reply. */
  canReply: ComputedRef<boolean>;
  /** True while the client may reopen the ticket. */
  canReopen: ComputedRef<boolean>;
};

/** Manager actions — the ticket's own capabilities plus lifecycle. */
export type UseClientTicketActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the ticket is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the ticket from the server. */
  refresh: () => Promise<void>;
  /** Posts a reply, resolving the message the server recorded. */
  reply: (model: TicketReplyModel) => Promise<ITicketMessage>;
  /**
   * Rewrites one of the client's OWN messages — legacy's inline editor
   * (`ticketMessage.vue:12-34`), which posted `replyUpdate` with the new body.
   */
  editMessage: (
    messageId: ITicketMessage["id"],
    model: TicketMessageModel
  ) => Promise<ITicketMessage>;
  /**
   * Withdraws one of the client's own messages — legacy's `replyDelete`
   * behind `openDeleteMessageModal`. The message stays on the thread as a
   * notice; what it said is still readable behind `openDeletedMessageModal`.
   */
  deleteMessage: (messageId: ITicketMessage["id"]) => Promise<void>;
  /** Removes one file named on a message — legacy's `ticketMessageFiles.vue:8`. */
  deleteAttachment: (
    messageId: ITicketMessage["id"],
    name: string
  ) => Promise<void>;
  /** Reopens a closed ticket. */
  reopen: () => Promise<void>;
  /** Closes the ticket. */
  close: () => Promise<void>;
  /** Detaches the related product. */
  removeRelatedProduct: () => Promise<void>;
  /** Grants one delegate access to this ticket. */
  delegate: (delegateId: IClientDelegate["id"]) => Promise<void>;
  /** Renames the thread — legacy's `changeTicketSubjectModal`. */
  setSubject: (model: TicketSubjectModel) => Promise<void>;
  /**
   * Points the thread at one of the client's products — legacy's
   * `add_related_product` / `change_related_product`, which are the same write
   * under two labels.
   */
  setRelatedProduct: (model: TicketRelatedProductModel) => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientTicketInternals = ContractInternals;
