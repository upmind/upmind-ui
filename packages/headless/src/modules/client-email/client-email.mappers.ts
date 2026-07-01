/** @internal */
import { useDate } from "../../utils";
import { map, isArray } from "lodash-es";
import type { Email, EmailModel } from "./client-email.types";
import type { IEmail } from "@upmind-automation/types";

export const mapEmails = (raw: IEmail | IEmail[]): Email[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapEmail);
};

export const mapEmail = (raw: IEmail): Email => {
  return {
    id: raw.id,
    type: raw.type,
    email: raw.email,
    title: raw.email,
    description: "",
    bouncedAt: useDate(raw.bounced_at),
    // ---
    meta: {
      isDefault: !!raw.default,
      isVerified: !!raw.verified,
      canDelete: raw.can_delete,
      isBounced: !!raw.bounced
    }
  };
};

export const mapIEmail = (data: EmailModel): IEmail => {
  return {
    email: data.email ?? ""
  } as IEmail;
};
