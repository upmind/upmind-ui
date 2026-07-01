import type { ResponseError } from "../../utils";
import type { CustomField } from "../client-custom-fields/client-custom-fields.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IClient, ILanguage } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

export interface FieldsModel {
  firstName?: string;
  lastName?: string;
  publicName?: string;
  language?: string;
  // ---
  customFields?: Record<string, any>;
}

export interface FieldsContext {
  id: IClient["id"];
  // ---
  lookups?: {
    fields: CustomField[];
    filterFields: string[];
    languages: ILanguage[];
  };
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: FieldsModel;
  baseModel?: FieldsModel;
  autoupdate?: boolean;
  // ---
  error?: ResponseError;
  controller?: AbortController;
}

export type ProfileField = {
  id: string;
  code: string;
  title: string;
  value: any;
  meta: CustomField["meta"] & {
    isCustomField: boolean;
  };
};
