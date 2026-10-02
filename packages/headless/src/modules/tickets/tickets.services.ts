/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { BrandConfigKeys, HookCodes } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { RequestSortDirection, useQuery } from "../query";
import { resolveClientId, useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapHookLogs,
  mapTicket,
  mapTicketMessage,
  mapTicketMessages,
  mapContractProductLookupItems,
  mapTicketLookupItems,
  mapTickets
} from "./tickets.mappers";
import {
  useContractProductLookupQuerySchema,
  useQuerySchema,
  useTicketLookupQuerySchema,
  useWireQuerySchema
} from "./tickets.schemas";
import { TICKET_ATTACHMENT_MAX_BYTES } from "./tickets.types";
import {
  applyProductScopeFilter,
  applyStatusCodeFilter,
  resolveContractProductId
} from "./tickets.utils";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  NotAuthenticatedError,
  responseCodes,
  useTime,
  useValidation
} from "../../utils";
import { assign, get, has, includes, isEmpty, isNil } from "lodash-es";
import type {
  ContractProductLookupQuery,
  ContractProductLookupQueryModel,
  Ticket,
  TicketAttachmentRef,
  TicketItemQuery,
  TicketLookupQuery,
  TicketLookupQueryModel,
  TicketMessage,
  TicketsListQuery,
  TicketsQueryModel,
  TicketsQuerySchema,
  TicketsServices,
  TicketStatusLog,
  TicketSupportPrefs
} from "./tickets.types";
import type { ResponseError } from "../../utils";
import type { LookupItem } from "../lookup";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IBrandTicketDepartment,
  IContractProduct,
  IHookLog,
  ITicket,
  ITicketMessage,
  TicketStatusCodes
} from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.services
 * @description The ONE services file both `useTickets` and
 * `useTicket` consume — mirrors `client-email-history.services.ts`'s
 * one-factory shape so the two composables can never disagree about whose
 * tickets are being read. `config.context` enters here and nowhere else.
 *
 * PATH LAW: every request below is `api/…`. No `api/admin/`, no
 * `.as('staff')`, no `.for('client', id)` — a guard spec asserts this by
 * source scan (T19).
 *
 * WARNING: do not import directly from another module. Resolve via
 * `useTickets.ts` / `useTicket.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key (`design.md` § "The one services factory"). */
export const queryKey: QueryKey = ["client", "tickets"];

const RECENT_ORDER: [RequestSortDirection, string] = [
  RequestSortDirection.DESC,
  "updated_at"
];

const THREAD_ORDER: [RequestSortDirection, string][] = [
  [RequestSortDirection.DESC, "created_at"],
  [RequestSortDirection.DESC, "id"]
];

/** The six status-change hook codes AC22's feed reads (`research.md` §2A-ii). */
const TICKET_HOOK_CODES = [
  HookCodes.TICKET_OPENED,
  HookCodes.TICKET_CLOSED,
  HookCodes.TICKET_REOPENED,
  HookCodes.TICKET_IN_PROGRESS,
  HookCodes.TICKET_CLIENT_REPLIED,
  HookCodes.TICKET_WAITING_RESPONSE
];

const LIST_WITH = [
  "client",
  "client.image",
  "client.tags",
  "department",
  "department.brand_ticket_departments",
  "lead",
  "lead.tags",
  "lead_user",
  "settings",
  "status",
  "users.image"
].join(",");

const ONE_WITH = [
  "account",
  "brand",
  "brand.image",
  "client",
  "client.image",
  "contract_product",
  "contract_product.product.image",
  "delegates",
  "delegates.client",
  "delegates.client.image",
  "department",
  "department.brand_ticket_departments",
  "import.credentials",
  "import.source",
  "invoice",
  "invoice.status",
  "lead",
  "lead_user.image",
  "settings",
  "status",
  "user",
  "users",
  "users.image"
].join(",");

/**
 * The ONE seam every request-issuing function in this file shares — the
 * target client falls through to the active session's own client; a
 * `.for('client', id)` retarget is never spelled here. The two contexts this
 * module declares is
 * `TicketsContextTypes.CONTRACT_PRODUCT` (the collection), and neither is `client` —
 * both name an ENTITY the read is about, never its owner.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();
  return isAuthenticated.value && !!clientId;
}

// -----------------------------------------------------------------------------
// COLLECTION

/**
 * AC1/AC2 — the criteria's ONE tri-state `isClosed` leaf as the TWO wire
 * shapes the API needs, written straight onto the request's own `url` (a
 * shared, mutable instance `request()` also writes to):
 *
 * | `filters.isClosed.eq` | the wire                               |
 * | --------------------- | -------------------------------------- |
 * | `false` (Active)      | `filter[status.code|neq]=ticket_closed` |
 * | `true` (Closed)       | `filter[status.code]=ticket_closed`     |
 * | absent (All)          | NEITHER key                            |
 *
 * Only the module can spell this: the two positions want two DIFFERENT
 * operators on one column, which no single schema leaf can declare, and the
 * column is dotted, which `useModelParser` cannot carry (R9 — see
 * `tickets.types.ts`). Both keys are cleared first, so a swap REPLACES the
 * narrowing rather than stacking "closed and not closed" and returning
 * nothing. `useWireQuerySchema` keeps the translator from minting a
 * `filter[isClosed|eq]` beside these — see its own `@decision`.
 *
 * Run via a `sync`-flush `watch` in `loadList` rather than `list()`'s own
 * `guard` hook: `useQuery.ts`'s `hasGuard = isPromise(guard)` tests the GUARD
 * FUNCTION ITSELF for thenability, which a plain function never satisfies, so
 * `guard` never actually runs (a pre-existing `query/**
 * @decision
 * what:     Re-validates a `setCriteria` candidate, merged onto the live
 *           model, against the RAW schema via `useValidation()` directly —
 *           never through `useModelParser` — before forwarding it.
 * why:      `useQueryCriteria.commit()` validates the candidate only AFTER
 *           `useModelParser` reshapes it, and that parser BUILDS its output
 *           by walking `schema.properties` — a key the schema never
 *           declared (e.g. a typo'd filter name) is never visited, so it is
 *           silently absent from the parsed candidate ajv checks, ajv sees
 *           nothing wrong, and the write is committed as if it were valid:
 *           `criteria.error` never fires and the caller has no way to know
 *           its write was ignored. Validating the RAW merged candidate here
 *           catches exactly the additional-property class `useModelParser`
 *           hides, without altering `query/**`'s parsing/commit pipeline.
 * rejected: Editing `useModelParser`/`useQueryCriteria` (`query/**`) to stop
 *           it silently dropping undeclared keys — a headless-core file
 *           shared by every schema-governed collection in the tree, off
 *           limits to this story (R9 precedent: route around at the
 *           module's own edge, never edit `query/**`).
 */
function guardCriteriaWrite(
  schema: TicketsQuerySchema,
  currentModel: TicketsQueryModel,
  candidate: Partial<TicketsQueryModel>
): ResponseError | undefined {
  const violations = useValidation().validate(
    schema,
    assign({}, currentModel, candidate)
  );
  if (isEmpty(violations)) return undefined;

  return mapToHeadlessError(
    new DetailedError(
      useI18n().t("error.query_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      violations
    )
  );
}

function loadList(
  scopeContext: ScopeContext | undefined,
  criteriaGuardError: Ref<ResponseError | undefined>
): TicketsListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const contractProductId = resolveContractProductId(scopeContext);
  const url = useUrl("tickets", { with: LIST_WITH, with_staged_imports: 1 });
  const schema = useQuerySchema();

  // AC-7 — before `list()`, so the very first request carries the narrowing.
  applyProductScopeFilter(url, contractProductId);

  /**
   * The `isClosed` position the module holds itself, because
   * {@link useWireQuerySchema} withholds the branch from the query core. It is
   * a CACHE KEY entry as well as a url write: the core's own key is built from
   * the filters it translated, so without this a tab swap would re-read the
   * previous tab's cached rows and never refetch.
   */
  const isClosed = ref<boolean | null>(null);

  const ticketsList = list<ITicket[], Ticket[], TicketsQueryModel>({
    criteria: { schema: useWireQuerySchema() },
    // The product context is a CACHE KEY entry for the same reason `isClosed`
    // is: the core builds its own key from the filters IT translated, and it
    // translates neither, so without this a product-scoped read and the
    // unscoped one would share a cache entry and serve each other's rows.
    queryKey: [
      ...queryKey,
      { client: clientId, isClosed, product: contractProductId }
    ],
    url,
    withAccessToken: true,
    guard: async () => {
      if (!isAddressable(clientId.value)) throw new NotAuthenticatedError();
      return true;
    },
    enabled: () => isAddressable(clientId.value),
    select: mapTickets,
    retry: false,
    staleTime: useTime().MINUTE,
    placeholderData: keepPreviousData
  });

  watch(isClosed, value => applyStatusCodeFilter(url, value), {
    immediate: true,
    flush: "sync"
  });

  /**
   * The model a consumer reads — the core's own, with the module-held
   * `isClosed` leaf folded back in, so the filter bar, the refinement chips and
   * the url replay all see ONE criteria model and the control can never claim a
   * narrowing the wire does not carry.
   */
  const criteria = computed<TicketsQueryModel>(() =>
    isNil(isClosed.value)
      ? ticketsList.criteria.value
      : assign({}, ticketsList.criteria.value, {
          filters: assign({}, ticketsList.criteria.value.filters, {
            isClosed: { eq: isClosed.value }
          })
        })
  );

  return {
    ...ticketsList,
    criteria,
    schema,
    isFiltered: computed(
      () => ticketsList.isFiltered.value || !isNil(isClosed.value)
    ),
    setCriteria: candidate => {
      const rejection = guardCriteriaWrite(schema, criteria.value, candidate);
      criteriaGuardError.value = rejection;
      if (rejection) return;

      // `setCriteria` merges at BRANCH level, so a write carrying `filters`
      // REPLACES that branch whole — a `filters` write without `isClosed` is
      // the leaf being cleared (Clear all, a chip removed), never left
      // standing. A write that names no `filters` at all (a sort, a page) does
      // not touch it.
      if (has(candidate, "filters"))
        isClosed.value = get(candidate, ["filters", "isClosed", "eq"], null);

      ticketsList.setCriteria(candidate);
    }
  };
}

/**
 * The tickets a picker offers — a `listInfinite` over THIS client's own
 * tickets, searched by the collection's own top-level `query` branch.
 *
 * It is a second query rather than the collection's own list because the two
 * answer different questions: the list carries the surface's filters, its tab
 * and its page, and a picker searching through them would offer only what is
 * already on screen. Its own key keeps a search from evicting the rows the
 * listing is showing.
 */
function loadTicketLookup(
  scopeContext: ScopeContext | undefined
): TicketLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<ITicket[], LookupItem[], TicketLookupQueryModel>({
    criteria: { schema: useTicketLookupQuerySchema() },
    queryKey: [...queryKey, "lookups", "tickets", { client: clientId }],
    url: useUrl("tickets", { with: "status" }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    select: mapTicketLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as TicketLookupQuery;
}

/**
 * The contract products a ticket can be linked to (AC-13) — THIS client's own,
 * searched by service identifier. Minted on the picker's first call.
 *
 * `exclude_delegated` keeps the list to products the client owns rather than
 * ones merely shared with them: linking a ticket to a product is a claim about
 * the client's own service, and the invoices picker draws the same line.
 */
function loadContractProductLookup(
  scopeContext: ScopeContext | undefined
): ContractProductLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<
    IContractProduct[],
    LookupItem[],
    ContractProductLookupQueryModel
  >({
    criteria: { schema: useContractProductLookupQuerySchema() },
    queryKey: [
      ...queryKey,
      "lookups",
      "contract-products",
      { client: clientId }
    ],
    // Same read the invoices picker makes: `contracts_products` scoped to the
    // resolved client, own products only. The bare `contract_products` read
    // (no `client_id`) returned nothing in the running app.
    url: useUrl("contracts_products", {
      client_id: clientId.value,
      with: "product",
      exclude_delegated: 1
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    select: mapContractProductLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as ContractProductLookupQuery;
}

/** AC8 — the narrower dashboard/recent list. A one-shot imperative read. */
async function loadRecentTickets(options: {
  limit?: number;
  clientId?: string;
  statusCode?: TicketStatusCodes;
}): Promise<Ticket[]> {
  const { get: getRequest, useUrl } = useQuery();

  return getRequest<ITicket[], Ticket[]>({
    queryKey: [...queryKey, "recent", options],
    url: useUrl("tickets", {
      limit: options.limit ?? 5,
      with: "status,client,client.image,department,department.brand_ticket_departments",
      ...(options.clientId ? { "filter[client_id]": options.clientId } : {}),
      ...(options.statusCode
        ? { "filter[status.code]": options.statusCode }
        : {})
    }),
    withAccessToken: true,
    sort: RECENT_ORDER,
    select: mapTickets,
    staleTime: useTime().MINUTE
  });
}

// -----------------------------------------------------------------------------
// MANAGER — single read + writes

function loadOne(
  ticketId?: string,
  scopeContext?: ScopeContext
): TicketItemQuery {
  const { query, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return query<ITicket, Ticket>({
    queryKey: [...queryKey, "ticket", ticketId, { client: clientId }],
    url: useUrl(`tickets/${ticketId}`, {
      with: ONE_WITH,
      with_staged_imports: 1
    }),
    withAccessToken: true,
    guard: async () => {
      if (!ticketId || !isAddressable(clientId.value)) {
        throw new NotAuthenticatedError();
      }
      return true;
    },
    enabled: () => !!ticketId && isAddressable(clientId.value),
    select: mapTicket,
    staleTime: useTime().MINUTE
  });
}

async function createTicket(body: Record<string, unknown>): Promise<Ticket> {
  const { post, useUrl } = useQuery();
  const raw = await post<ITicket>({
    mutationKey: [...queryKey, "create"],
    url: useUrl("tickets"),
    data: body,
    withAccessToken: true
  });
  return mapTicket(raw);
}

async function updateTicket(
  ticketId: string,
  patch: Record<string, unknown>
): Promise<Ticket> {
  const { put, useUrl } = useQuery();
  const raw = await put<ITicket>({
    mutationKey: [...queryKey, "ticket", ticketId, "update"],
    url: useUrl(`tickets/${ticketId}`),
    data: patch,
    withAccessToken: true
  });
  return mapTicket(raw);
}

async function setStatus(
  ticketId: string,
  statusCode: string
): Promise<Ticket> {
  const { put, useUrl } = useQuery();
  const raw = await put<ITicket>({
    mutationKey: [...queryKey, "ticket", ticketId, "status"],
    url: useUrl(`tickets/${ticketId}/status`),
    data: { status_code: statusCode },
    withAccessToken: true
  });
  return mapTicket(raw);
}

// -----------------------------------------------------------------------------
// MESSAGE THREAD (AC14/AC15) — cursor-paged, `limit+1` has-more probe

async function loadMessages(
  ticketId: string,
  params: {
    before?: string;
    after?: string;
    limit?: number;
    attachmentsOnly?: boolean;
  } = {}
): Promise<{ rows: TicketMessage[]; hasMore: boolean }> {
  const { get: getRequest, useUrl } = useQuery();
  const limit = params.limit ?? 10;

  const url = useUrl(`tickets/${ticketId}/messages`, {
    with: "files",
    limit: limit + 1,
    "filter[is_log]": 0,
    ...(params.attachmentsOnly ? { "filter[files.id|gt]": 0 } : {}),
    ...(params.after ? { "filter[id|gt]": params.after } : {}),
    ...(params.before ? { "filter[id|lt]": params.before } : {})
  });

  const raw = await getRequest<ITicketMessage[]>({
    queryKey: [...queryKey, "messages", ticketId, params],
    url,
    withAccessToken: true,
    sort: THREAD_ORDER,
    staleTime: useTime().IMMEDIATE
  });

  const hasMore = raw.length > limit;
  return { rows: mapTicketMessages(raw.slice(0, limit)), hasMore };
}

async function loadMessage(
  ticketId: string,
  messageId: string
): Promise<TicketMessage> {
  const { get: getRequest, useUrl } = useQuery();
  const raw = await getRequest<ITicketMessage>({
    queryKey: [...queryKey, "message", ticketId, messageId],
    url: useUrl(`tickets/${ticketId}/messages/${messageId}`, { with: "files" }),
    withAccessToken: true,
    staleTime: useTime().IMMEDIATE
  });
  return mapTicketMessage(raw);
}

/**
 * @decision
 * what:     A `409 ticket_has_more_recent_reply` resolves to `undefined`
 *           rather than rejecting.
 * why:      Legacy treats it as a caution, never an error (`research.md` D3):
 *           the caller re-fetches the thread forward instead of showing a
 *           failure toast. `DetailedError.apiCode` is the structured code the
 *           shared `handleError` already preserves (`query.utils.ts`), so no
 *           new error-parsing surface is needed.
 * rejected: Throwing and letting the caller catch — would force every
 *           consumer to special-case one apiCode string, and the manager's
 *           `meta`/`actions` layers are the one place that should know it.
 */
async function postReply(
  ticketId: string,
  payload: Record<string, unknown>
): Promise<TicketMessage | undefined> {
  const { post, useUrl } = useQuery();
  return post<ITicketMessage>({
    mutationKey: [...queryKey, "ticket", ticketId, "reply"],
    url: useUrl(`tickets/${ticketId}/replies`),
    data: payload,
    withAccessToken: true
  })
    .then(raw => mapTicketMessage(raw))
    .catch(error => {
      if (
        error instanceof DetailedError &&
        error.apiCode === "ticket_has_more_recent_reply"
      ) {
        return undefined;
      }
      throw error;
    });
}

async function editReply(
  ticketId: string,
  replyId: string,
  body: Record<string, unknown>
): Promise<TicketMessage> {
  const { put, useUrl } = useQuery();
  const raw = await put<ITicketMessage>({
    mutationKey: [...queryKey, "ticket", ticketId, "reply", replyId],
    url: useUrl(`tickets/${ticketId}/replies/${replyId}`),
    data: body,
    withAccessToken: true
  });
  return mapTicketMessage(raw);
}

async function deleteMessage(
  ticketId: string,
  messageId: string,
  reason: string
): Promise<void> {
  const { del, useUrl } = useQuery();
  await del({
    mutationKey: [
      ...queryKey,
      "ticket",
      ticketId,
      "message",
      messageId,
      "delete"
    ],
    url: useUrl(`tickets/${ticketId}/messages/${messageId}`),
    data: { reason },
    withAccessToken: true
  });
}

async function deleteFile(
  ticketId: string,
  messageId: string,
  fileId: string
): Promise<void> {
  const { del, useUrl } = useQuery();
  await del({
    mutationKey: [
      ...queryKey,
      "ticket",
      ticketId,
      "message",
      messageId,
      "file",
      fileId
    ],
    url: useUrl(`tickets/${ticketId}/messages/${messageId}/files/${fileId}`),
    withAccessToken: true
  });
}

/**
 * @decision
 * what:     Downloads the raw file with a plain `fetch()`, bypassing
 *           `useQuery()`.
 * why:      `doFetch` (`query/query.services.ts`) unconditionally calls
 *           `response.json()`; a binary attachment is not JSON, so the shared
 *           request path cannot carry it without changing that shared file —
 *           a headless-core edit this story does not authorise. This stays
 *           entirely module-local: same bearer-token seam, same base URL.
 * rejected: Editing `doFetch` to add a `responseType` branch — the shared
 *           request pipeline every module depends on, out of this story's
 *           scope and not asked for by any AC.
 */
async function downloadFile(fileId: string): Promise<ArrayBuffer> {
  const { useUrl } = useQuery();
  const url = useUrl(`ticket_messages/files/${fileId}/download`);
  const { session } = useActiveSession().useContext();
  const token = session.value?.access_token;

  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    throw new DetailedError(
      "Failed to download attachment",
      response.status,
      ErrorOrigin.Upmind
    );
  }

  return response.arrayBuffer();
}

// -----------------------------------------------------------------------------
// STATUS LOG FEED (AC22)

async function loadStatusLogs(ticketId: string): Promise<TicketStatusLog[]> {
  const { get: getRequest, useUrl } = useQuery();
  const clientId = resolveClientId(undefined);

  const raw = await getRequest<IHookLog[]>({
    queryKey: [...queryKey, "status-logs", ticketId],
    url: useUrl(`hooks/logs/client/${clientId.value}`, {
      "filter[object_type]": "ticket",
      "filter[object_id]": ticketId,
      "filter[hook.code]": TICKET_HOOK_CODES.join(","),
      with: "hook,object.status",
      with_staged_imports: 1
    }),
    withAccessToken: true,
    sort: THREAD_ORDER,
    staleTime: useTime().IMMEDIATE
  });

  return mapHookLogs(raw);
}

// -----------------------------------------------------------------------------
// ATTACHMENT UPLOAD (R2 — tickets-local, exactly as legacy `filesProvider.vue`)

/**
 * AC23 — checked BEFORE any request: size ceiling and the brand's
 * `ALLOWED_UPLOAD_FILE_TYPES`. Ships one tickets-local
 * `POST api/ticket_messages/files`; `system-upload` is not touched (R2).
 *
 * `brand_id` is read off the active session's own user
 * (`ISelf.brand_id`, session-store FE-2973), not `useBrand().brandId` — the
 * latter is the global brand-settings singleton, resolved independently of
 * the caller's session and not guaranteed settled by the time an upload
 * fires (the same class of race `client-custom-fields.services.ts` moved
 * off of; see its `loadClientBrandId` comment).
 */
async function uploadFile(file: File): Promise<TicketAttachmentRef> {
  const { post, useUrl } = useQuery();
  const { ensureConfig } = useBrand();
  const { activeUser } = useActiveSession().useContext();

  if (file.size > TICKET_ATTACHMENT_MAX_BYTES) {
    throw new DetailedError(
      "File is too large to upload",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      { size: file.size }
    );
  }

  const allowedTypes = await ensureConfig(
    BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES
  ).then(config => get(config, BrandConfigKeys.ALLOWED_UPLOAD_FILE_TYPES));

  if (!isEmpty(allowedTypes) && !includes(allowedTypes, file.type)) {
    throw new DetailedError(
      "File type is not allowed",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      { type: file.type }
    );
  }

  const body = new FormData();
  body.append("file", file);
  const brandId = activeUser.value?.brandId;
  if (brandId) body.append("brand_id", brandId);

  const result = await post<TicketAttachmentRef[]>({
    mutationKey: [...queryKey, "upload"],
    url: useUrl("ticket_messages/files"),
    data: body,
    withAccessToken: true
  });

  return result[0];
}

// -----------------------------------------------------------------------------
// BRAND DESK LOOKUP — the brand-public desk list for the create form.
// The all-desks and ticket-status reads live in `system` (useSystem).

async function loadBrandDepartments(): Promise<IBrandTicketDepartment[]> {
  const { get: getRequest, useUrl } = useQuery();
  return getRequest<IBrandTicketDepartment[]>({
    queryKey: [...queryKey, "brand-departments"],
    url: useUrl("brand/tickets/departments", { limit: 0, with: "department" }),
    withAccessToken: true,
    staleTime: useTime().DAY
  });
}

// -----------------------------------------------------------------------------
// SUPPORT PREFERENCES (R7 — read-modify-write over the client meta map)

const PREF_KEYS = {
  submitWithShortcut: "ui/support/submitWithShortcut",
  newLineKey: "ui/support/newLine",
  limit: "ui/support/limit"
} as const;

/**
 * @decision
 * what:     Reads the current client record, merges the given prefs into
 *           its `meta` map, and PUTs the whole map back.
 * why:      Legacy replaces the WHOLE meta map in one `PUT` (D10), so a
 *           naive partial write clobbers `ui/support/messageSignature`
 *           (FE-1931's key). Read-modify-write is the only shape that
 *           preserves an untouched sibling key (AC33, R7).
 * rejected: A partial `PUT` carrying only the changed keys — this repo's
 *           `PUT api/clients/{id}` contract replaces `meta` wholesale, so a
 *           partial body would delete every key it does not name.
 */
async function saveSupportPrefs(
  clientId: string,
  prefs: Partial<TicketSupportPrefs>
): Promise<TicketSupportPrefs> {
  const { get: getRequest, put, useUrl } = useQuery();

  const current = await getRequest<{ meta?: Record<string, unknown> }>({
    queryKey: [...queryKey, "client-meta", clientId],
    url: useUrl(`clients/${clientId}`),
    withAccessToken: true,
    staleTime: useTime().IMMEDIATE
  });

  const meta = { ...(current.meta ?? {}) };
  if ("submitWithShortcut" in prefs) {
    meta[PREF_KEYS.submitWithShortcut] = prefs.submitWithShortcut;
  }
  if ("newLineKey" in prefs) meta[PREF_KEYS.newLineKey] = prefs.newLineKey;
  if ("limit" in prefs) meta[PREF_KEYS.limit] = prefs.limit;

  await put({
    mutationKey: [...queryKey, "client-meta", clientId, "save"],
    url: useUrl(`clients/${clientId}`),
    data: { meta },
    withAccessToken: true
  });

  return {
    submitWithShortcut: !!get(meta, PREF_KEYS.submitWithShortcut),
    newLineKey: (get(meta, PREF_KEYS.newLineKey) ??
      "enter") as TicketSupportPrefs["newLineKey"],
    limit: Number(get(meta, PREF_KEYS.limit)) || 20
  };
}

// -----------------------------------------------------------------------------
// Scope-Ready Services — armless (no `.{actor}.ts` sibling, `design.md` §
// "Arms determination")

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useTickets.ts` calls it once and so does
 * `useTicket.ts`, each with ITS OWN resolved scope.
 */
export const createTicketsServices = (
  _scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext,
  recordId?: string
): TicketsServices => {
  const clientId = resolveClientId(scopeContext);
  const { brandId } = useBrand();

  // The ONE ticket this instance reads — the manager's `.withId(id)`, handed in
  // rather than read off the context. It rode `.for('ticket', id)` until an
  // operator review on 2026-09-22: a single record is an instance, not an
  // entity the actor acts upon.
  const ticketId = recordId;

  /** AC-CE (R9 fold-in) — the last REJECTED `setCriteria` write, per scope. */
  const criteriaGuardError = ref<ResponseError | undefined>(undefined);

  return {
    queryKey,
    clientId,
    brandId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => criteriaGuardError.value),

    loadList: () => loadList(scopeContext, criteriaGuardError),

    /**
     * The picker's lookups, one per pickable record. A THUNK per entry so the
     * first fetch defers to the control's own read (`TicketLookupService`).
     */
    lookups: {
      ticket: () => loadTicketLookup(scopeContext),
      contract_product: () => loadContractProductLookup(scopeContext)
    },

    loadOne: (id = ticketId) => loadOne(id, scopeContext),
    createTicket,
    updateTicket,
    setStatus,

    loadMessages,
    loadMessage,
    postReply,
    editReply,
    deleteMessage,
    deleteFile,
    downloadFile,

    loadStatusLogs,
    uploadFile,

    loadBrandDepartments,

    saveSupportPrefs: prefs => {
      if (!clientId.value) throw new NotAuthenticatedError();
      return saveSupportPrefs(clientId.value, prefs);
    }
  };
};

export { loadRecentTickets };
export default createTicketsServices;
