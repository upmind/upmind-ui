/** @internal */
import {
  type IClient,
  SentEmailStatus,
  type ISentEmail
} from "@upmind-automation/types";
import { useDate } from "../../utils";
import { map, isArray } from "lodash-es";
import type { SentEmail } from "./client-email-history.types";

export const mapEmailHistory = (
  raw: ISentEmail | ISentEmail[]
): SentEmail[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapReceivedEmail);
};

export const mapReceivedEmail = (raw: ISentEmail): SentEmail => {
  const client = raw.recipient as IClient;
  const status = mapEmailStatus(raw);
  return {
    body: (raw as any).data?.body ?? "",
    cc: raw.cc,
    recipient: {
      name: client.fullname || "",
      email: client.email || "",
      imageUrl: client?.image?.full_url || ""
    },
    // Status-conditional display date (legacy emailHistory table); the three
    // source dates stay available for the detail/consumers.
    date: mapDisplayDate(raw, status),
    dateBounced: useDate(raw.bounced_at),
    dateCreated: useDate(raw.created_at),
    dateErrored: useDate(raw.updated_at),
    dateSent: useDate(raw.sent_at),
    from: raw.from,
    id: raw.id,
    status,
    subject: raw.subject,
    to: raw.to,
    // ----
    meta: {
      isBounced: raw.bounced || false,
      isError: !!raw.error_id,
      isSent: raw.sent || false
    }
  };
};

/**
 * The list's display date, chosen BY STATUS — legacy shows `sent_at` when sent,
 * `bounced_at` when bounced, `updated_at` when errored, and no date while still
 * sending. This is why binding `dateSent` unconditionally showed empty rows.
 */
const mapDisplayDate = (raw: ISentEmail, status: SentEmailStatus) => {
  switch (status) {
    case SentEmailStatus.ERROR:
      return useDate(raw.updated_at);
    case SentEmailStatus.BOUNCED:
      return useDate(raw.bounced_at);
    case SentEmailStatus.SENT:
      return useDate(raw.sent_at);
    default:
      return { date: null, relative: null };
  }
};

export const mapEmailStatus = (email: ISentEmail): SentEmailStatus => {
  if (email.error_id) return SentEmailStatus.ERROR;
  else if (email.bounced) return SentEmailStatus.BOUNCED;
  else if (email.sent) return SentEmailStatus.SENT;
  else return SentEmailStatus.SENDING;
};
