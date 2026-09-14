/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed } from "vue";
import { BrandConfigKeys, HookCodes } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { RequestSortDirection, useQuery } from "../query";
import { resolveClientId, useActiveSession } from "../session-store";
import {
  mapHookLogs,
  mapTicket,
  mapTicketMessage,
  mapTicketMessages,
  mapTickets
} from "./tickets.mappers";
import { useQuerySchema } from "./tickets.schemas";
import {
  TICKET_ATTACHMENT_MAX_BYTES,
  TicketContextTypes
} from "./tickets.types";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useTime
} from "../../utils";
import { get, includes, isEmpty } from "lodash-es";
import type {
  Ticket,
  TicketAttachmentRef,
  TicketItemQuery,
  TicketMessage,
  TicketsListQuery,
  TicketsQueryModel,
  TicketsServices,
  TicketStatusLog,
  TicketSupportPrefs
} from "./tickets.types";
import type { ResponseError } from "../../utils";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IBrandTicketDepartment,
  IHookLog,
  IStatus,
  ITicket,
  ITicketDepartment,
  ITicketMessage,
  TicketStatusCodes
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.services
 * @description The ONE services file both `useClientTickets` and
 * `useClientTicket` consume — mirrors `client-email-history.services.ts`'s
 * one-factory shape so the two composables can never disagree about whose
 * tickets are being read. `config.context` enters here and nowhere else.
 *
 * PATH LAW: every request below is `api/…`. No `api/admin/`, no
 * `.as('staff')`, no `.for('client', id)` — a guard spec asserts this by
 * source scan (T19).
 *
 * WARNING: do not import directly from another module. Resolve via
 * `useClientTickets.ts` / `useClientTicket.ts` only
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
 * `.for('client', id)` retarget is never spelled here (`ticket` is the only
 * context this module declares, `TicketContextTypes.TICKET`, never `client`).
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();
  return isAuthenticated.value && !!clientId;
}

// -----------------------------------------------------------------------------
// COLLECTION

function loadList(scopeContext?: ScopeContext): TicketsListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<ITicket[], Ticket[], TicketsQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url: useUrl("tickets", { with: LIST_WITH, with_staged_imports: 1 }),
    withAccessToken: true,
    withSplitCount: true,
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
  try {
    const raw = await post<ITicketMessage>({
      mutationKey: [...queryKey, "ticket", ticketId, "reply"],
      url: useUrl(`tickets/${ticketId}/replies`),
      data: payload,
      withAccessToken: true
    });
    return mapTicketMessage(raw);
  } catch (error) {
    if (
      error instanceof DetailedError &&
      error.apiCode === "ticket_has_more_recent_reply"
    ) {
      return undefined;
    }
    throw error;
  }
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
 */
async function uploadFile(file: File): Promise<TicketAttachmentRef> {
  const { post, useUrl } = useQuery();
  const { ensureConfig, brandId } = useBrand();

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
  if (brandId.value) body.append("brand_id", brandId.value);

  const result = await post<TicketAttachmentRef[]>({
    mutationKey: [...queryKey, "upload"],
    url: useUrl("ticket_messages/files"),
    data: body,
    withAccessToken: true
  });

  return result[0];
}

// -----------------------------------------------------------------------------
// DEPARTMENT + STATUS LOOKUPS (R3 — owned by `tickets`, never `system`)

async function loadBrandDepartments(): Promise<IBrandTicketDepartment[]> {
  const { get: getRequest, useUrl } = useQuery();
  return getRequest<IBrandTicketDepartment[]>({
    queryKey: [...queryKey, "brand-departments"],
    url: useUrl("brand/tickets/departments", { limit: 0, with: "department" }),
    withAccessToken: true,
    staleTime: useTime().DAY
  });
}

async function loadDepartments(): Promise<ITicketDepartment[]> {
  const { get: getRequest, useUrl } = useQuery();
  return getRequest<ITicketDepartment[]>({
    queryKey: [...queryKey, "departments"],
    url: useUrl("tickets/departments", {
      limit: 0,
      with: "brand_ticket_departments"
    }),
    withAccessToken: true,
    staleTime: useTime().DAY
  });
}

async function loadTicketStatuses(): Promise<
  { code: TicketStatusCodes; name: string }[]
> {
  const { get: getRequest, useUrl } = useQuery();
  const raw = await getRequest<IStatus[]>({
    queryKey: [...queryKey, "statuses"],
    url: useUrl("statuses", { "filter[object_type]": "ticket" }),
    withAccessToken: true,
    staleTime: useTime().DAY
  });

  return raw.map(status => ({
    code: status.code as unknown as TicketStatusCodes,
    name: status.name
  }));
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
 * first, at construction. `useClientTickets.ts` calls it once and so does
 * `useClientTicket.ts`, each with ITS OWN resolved scope.
 */
export const createTicketsServices = (
  _scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): TicketsServices => {
  const clientId = resolveClientId(scopeContext);
  const { brandId } = useBrand();
  const ticketId =
    scopeContext?.type === TicketContextTypes.TICKET
      ? scopeContext.id
      : undefined;

  return {
    queryKey,
    clientId,
    brandId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed<ResponseError | undefined>(() => undefined),

    loadList: () => loadList(scopeContext),
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
    loadDepartments,
    loadTicketStatuses,

    saveSupportPrefs: prefs => {
      if (!clientId.value) throw new NotAuthenticatedError();
      return saveSupportPrefs(clientId.value, prefs);
    }
  };
};

export { loadRecentTickets };
export default createTicketsServices;
