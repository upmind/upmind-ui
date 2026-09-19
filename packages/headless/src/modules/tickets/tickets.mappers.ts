/** @internal */
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

/** Passthrough — `ITicket` already carries the corrected field names (AC-PM). */
export const mapTicket = (raw: ITicket): Ticket => raw;

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
  isDeleted: !!raw.is_log
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
