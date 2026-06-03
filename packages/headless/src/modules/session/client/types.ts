// --- internal

import type { Client, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";
import type { IPhoneData } from "../../client/phone/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export interface ClientContext {
  client?: Client;
  error?: ResponseError;
  transfer?: IAuthTransfer;
  // --- guest-client form state (upgrade + email). Mirrors GuestContext so the
  // client machine can own these forms once the guest machine is gone.
  // `model` is `any` like GuestContext (it holds register- or email-shaped data).
  customFields?: any[];
  model?: any;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export type CompleteRegistrationModel = {
  customFields?: Record<string, unknown>;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone?: IPhoneData;
};

export type GuestEmailModel = {
  email?: string;
};

export type ClientFormModel = Partial<CompleteRegistrationModel> &
  GuestEmailModel;
