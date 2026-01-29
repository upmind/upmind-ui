// --- utils
import { map, isArray } from "lodash-es";

// --- types
import type { SentEmail } from "./types";
import {
  type IClient,
  SentEmailStatus,
  type ISentEmail
} from "@upmind-automation/types";
import { useDateMapper } from "../../../utils";

export const mapEmailHistory = (
  raw: ISentEmail | ISentEmail[]
): SentEmail[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapReceivedEmail);
};

export const mapReceivedEmail = (raw: ISentEmail): SentEmail => {
  const client = raw.recipient as IClient;
  return {
    body: (raw as any).data?.body ?? "",
    recipient: {
      name: client.fullname || "",
      email: client.email || "",
      imageUrl: client?.image?.full_url || ""
    },
    dateBounced: useDateMapper(raw.bounced_at),
    dateErrored: useDateMapper(raw.updated_at),
    dateSent: useDateMapper(raw.sent_at),
    from: raw.from,
    id: raw.id,
    status: mapEmailStatus(raw),
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

export const mapEmailStatus = (email: ISentEmail): SentEmailStatus => {
  if (email.error_id) return SentEmailStatus.ERROR;
  else if (email.bounced) return SentEmailStatus.BOUNCED;
  else if (email.sent) return SentEmailStatus.SENT;
  else return SentEmailStatus.SENDING;
};
