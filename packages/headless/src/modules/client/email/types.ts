// --- internal

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
export const EmailTypes = [{ key: 1, value: "Account" }];

export interface EmailModel {
  id?: IEmail["id"];
  email: IEmail["email"] | null;
  // type: IEmail["type"]; // deprecated
}

export interface Email extends EmailModel {
  //--- identifier
  id: IEmail["id"];
  //--- computed details
  title: string;
  description: string;
  type: IEmail["type"];
  // --- meta info
  meta: {
    isDefault: boolean;
    canDelete: boolean;
    isVerified: boolean;
  };
}

export interface EmailContext extends ClientItemContext<EmailModel> {}
