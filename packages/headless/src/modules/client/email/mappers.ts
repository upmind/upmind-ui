// --- utils
import { map, isArray } from "lodash-es";

// --- types
import type { Email, EmailModel } from "./types";
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
    description: raw.verified ? "Verified" : "Unverified",
    // ---
    meta: {
      isDefault: !!raw.default,
      isVerified: !!raw.verified,
      canDelete: raw.can_delete,
    },
  };
};

export const mapIEmail = (data: EmailModel): IEmail => {
  return {
    type: data.type,
    email: data.email,
  } as IEmail;
};
