// --- types
import type { PhoneModel } from "../../client";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { Token } from "../types";
import type { ResponseError } from "../../../utils";

// -----------------------------------------------------------------------------

type GuestModelType = LoginModel | RegisterModel | TWOFAModel | RecoverModel;

export interface GuestContext<ModelType extends GuestModelType = any> {
  token: Token;
  error?: ResponseError;
  // ---
  // TODO:
  // customFields: Array;
  customFields: any[];
  baseModel?: GuestModelType;
  model: ModelType;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export interface LoginModel {
  username?: string;
  password?: string;
}

export interface RegisterModel {
  username?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  phone?: PhoneModel["phone"];
  customFields?: Record<string, any>;
}

export interface TWOFAModel {
  token?: string;
}

export interface RecoverModel {
  username?: string;
}
