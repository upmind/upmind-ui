// --- types
import { QueryResponseError } from "../../query";
import type { PhoneModel } from "../../client/phone/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ErrorObject } from "ajv";
import { Token } from "../types";

// -----------------------------------------------------------------------------

type GuestModelType = LoginModel | RegisterModel | TWOFAModel | RecoverModel;

export interface GuestContext<ModelType extends GuestModelType = any> {
  token: Token;
  error?: QueryResponseError | ErrorObject[];
  // ---
  // TODO:
  // customFields: Array;
  customFields: any[];
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
