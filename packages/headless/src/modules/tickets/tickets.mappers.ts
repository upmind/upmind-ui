/** @internal */
import { TicketStatusCodes } from "@upmind-automation/types";
import { mapContractProductEmbedded } from "../contract-product";
import { useDate } from "../../utils";
import { isArray, map, orderBy } from "lodash-es";
import type {
  Ticket,
  TicketDepartmentOption,
  TicketFeedEntry,
  TicketMessage,
  TicketStatusLog
} from "./tickets.types";
import type { LookupItem } from "../lookup";
import type {
  IBrandTicketDepartment,
  IContractProduct,
  IHookLog,
  ITicket,
  ITicketDepartment,
  ITicketMessage
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.mappers
 * @description Ticket, message, hook-log and department mappers. Every
 * mapper is TOTAL (hazard Z3): a throwing `select` masks the error as a 200
 * with zero rows, so an unrecognised value passes through rather than
 * throwing.
 */
// -----------------------------------------------------------------------------

export const mapTickets = (raw: ITicket | ITicket[]): Ticket[] =>
  map(isArray(raw) ? raw : [raw], mapTicket);

/** `ITicket` carries the corrected field names (AC-PM); the one embedded
 * relation that is NOT raw is `contract_product`, mapped through the
 * contract-product module's `mapContractProductEmbedded` (the contract-product
 * view model minus the members that need `allowed_migrations` or the parent
 * contract relation, which the single read does not carry). */
export const mapTicket = (raw: ITicket): Ticket => {
  // `ITicket` types `contract_product_id` but not the embedded relation; the
  // single read (`ONE_WITH`) returns it beside the id.
  const linkedProduct = (
    raw as ITicket & { contract_product?: IContractProduct }
  ).contract_product;

  return {
    ...raw,
    contract_product: linkedProduct
      ? mapContractProductEmbedded(linkedProduct)
      : undefined,
    // The wire's `updated_at` is `YYYY-MM-DD HH:mm:ss`, and a surface draws a
    // date through a `useDate` descriptor, never a raw string — `TableCellDate`
    // reads `.relative` off one. The raw field stays; this is added beside it.
    dateUpdated: useDate(raw.updated_at, undefined, "MMM Do, YYYY h:mm A"),
    dateCreated: useDate(raw.created_at, undefined, "MMM Do, YYYY h:mm A"),
    meta: {
      isOpen: raw.status?.code === TicketStatusCodes.OPEN,
      isAwaitingResponse:
        raw.status?.code === TicketStatusCodes.AWAITING_RESPONSE,
      isClientReplied: raw.status?.code === TicketStatusCodes.CLIENT_REPLIED,
      isInProgress: raw.status?.code === TicketStatusCodes.IN_PROGRESS,
      isScheduled: raw.status?.code === TicketStatusCodes.SCHEDULED,
      isClosed: raw.status?.code === TicketStatusCodes.CLOSED,
      isDelegated: !!raw.is_delegated_object,
      isLocked: !!raw.settings?.lock
    }
  };
};

export const mapTicketMessages = (
  raw: ITicketMessage | ITicketMessage[]
): TicketMessage[] => map(isArray(raw) ? raw : [raw], mapTicketMessage);

/**
 * Q5 (`research.md` §11) resolved by the recorded withdrawal fixture (T2):
 * the wire never populates `deleted_at`; a withdrawal is a separate
 * `is_log: true` row, so `isDeleted` reads off `is_log`.
 */
export const mapTicketMessage = (raw: ITicketMessage): TicketMessage => ({
  ...raw,
  isDeleted: !!raw.is_log,
  dateCreated: useDate(raw.created_at, undefined, "MMM Do, YYYY h:mm A")
});

export const mapHookLogs = (raw: IHookLog | IHookLog[]): TicketStatusLog[] =>
  map(isArray(raw) ? raw : [raw], mapHookLog);

export const mapHookLog = (raw: IHookLog): TicketStatusLog => raw;

/**
 * AC22 — merges messages and status-log rows into ONE feed ordered by
 * created date, newest first. Neither source is required to already be
 * sorted; the merge is total over whatever each source returns.
 */
export const mergeFeed = (
  messages: TicketMessage[],
  logs: TicketStatusLog[]
): TicketFeedEntry[] =>
  orderBy(
    [
      ...map(
        messages,
        (message): TicketFeedEntry => ({
          kind: "message",
          message
        })
      ),
      ...map(logs, (log): TicketFeedEntry => ({ kind: "log", log }))
    ],
    entry =>
      entry.kind === "message"
        ? entry.message.created_at
        : entry.log.created_at,
    "desc"
  );

export const mapBrandDepartmentOptions = (
  rows: IBrandTicketDepartment[]
): TicketDepartmentOption[] =>
  map(rows, row => ({
    value: row.ticket_department_id,
    label:
      row.name_translated ||
      row.name ||
      row.department?.name_translated ||
      row.department?.name ||
      "",
    isDefault: !!row.default
  }));

export const mapDepartmentName = (
  brandDepartment?: IBrandTicketDepartment,
  department?: ITicketDepartment
): string =>
  brandDepartment?.name_translated ||
  brandDepartment?.name ||
  department?.name_translated ||
  department?.name ||
  "";

/**
 * One ticket as a lookup option. A hand recognises a ticket by its REFERENCE —
 * that is what the listing prints and what a colleague quotes — so the
 * reference is the label and the subject rides beneath it as the description.
 * The id is the value because that is what the manager loads by.
 */
export const mapTicketLookupItem = (raw: ITicket): LookupItem => ({
  value: raw.id,
  label: raw.reference || raw.id,
  description: raw.subject ?? undefined
});

/** The ticket lookup query's `select` — every row as a selectable option. */
export const mapTicketLookupItems = (raw: ITicket[]): LookupItem[] =>
  map(raw, mapTicketLookupItem);

/**
 * One contract product as a lookup option. A client recognises their own
 * product by its service identifier — their domain, their service name — so
 * that is the label, falling back to the product's name when a record carries
 * no identifier. The value is the contract-product id, which is what
 * `setRelatedProduct` links by (AC-13).
 */
export const mapContractProductLookupItem = (
  raw: IContractProduct
): LookupItem => ({
  value: raw.id,
  label: raw.service_identifier || raw.product_name || raw.name || raw.id
});

/** The contract-product lookup query's `select`. */
export const mapContractProductLookupItems = (
  raw: IContractProduct[] = []
): LookupItem[] => map(raw, mapContractProductLookupItem);
