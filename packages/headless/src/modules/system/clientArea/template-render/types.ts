import { ClientAreaTemplateTypes } from "@upmind-automation/types";

/******************************************************************************/
// Template

export type ClientAreaTemplate = {
  type: ClientAreaTemplateTypes;
  body: string;
  title: string;
  meta?: Record<string, any>;
};
