// --- internal
import type { Client, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";
import type { IPhoneData } from "../../client/phone/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export interface VerifyEmailModel {
  code?: string;
}

// Which guest-client form occupies the shared `unregistered` form node.
export enum ClientFormType {
  REGISTER = "register",
  EMAIL = "email"
}

export interface ClientContext {
  client?: Client;
  error?: ResponseError;
  transfer?: IAuthTransfer;
  // --- form state. One shared form surface (register / email / verify); the
  // active form's schema/model live here and `formType` says which it is.
  customFields?: any[];
  formType?: ClientFormType;
  model?: ClientFormModel;
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
  GuestEmailModel &
  VerifyEmailModel;
