// --- utils
import { map, isArray } from "lodash-es";

// --- types
import type { Email } from "./types";
import type { IEmail } from "@upmind-automation/types";

export const mapEmail = (raw: IEmail | IEmail[]): Email[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, rawItem => {
    return {
      id: rawItem.id,
      type: rawItem.type,
      email: rawItem.email,
      title: rawItem.email,
      default: rawItem.default,
      description: rawItem.verified ? "Verified" : "Unverified",
    };
  });
};
