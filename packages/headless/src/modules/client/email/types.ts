// --- internal
import { useClientEmail } from "./useClientEmail";
import { useClientEmails } from "./useClientEmails";

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
export const EmailTypes = [{ key: 1, value: "Account" }];

export interface EmailModel {
  type: IEmail["type"];
  email: IEmail["email"];
}

export interface Email extends EmailModel {
  //--- identifier
  id: IEmail["id"];
  //--- computed details
  title: string;
  description: string;
  // --- meta info
  meta: {
    isDefault: IEmail["default"];
    canDelete: IEmail["can_delete"];
    isVerified: IEmail["verified"];
  };
}

export type UseClientEmail = ReturnType<typeof useClientEmail>;

export type UseClientEmails = ReturnType<typeof useClientEmails>;

export interface EmailContext extends ClientItemContext {}
