// --- internal
import { useUnified } from "./unified/useUnified";

// --- types
import type { BillingContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { remove, unset } from "lodash-es";
import { useClientAddress, useClientAddresses } from "src/modules/client";

// -----------------------------------------------------------------------------

export const useSchema = ({ model, config }: BillingContext) => {
  const schema: JsonSchema = {
    type: "object",
    required: [] as string[],
    properties: {
      addressId: {
        type: "string",
        default: model?.addressId || null
      },
      companyId: {
        type: "string",
        default: model?.companyId || null
      },
      phoneId: {
        type: "string",
        default: model?.phoneId || null
      }
    }
  };

  if (config?.requiresPhone) {
    schema.required!.push("phoneId");
  } else {
    schema.properties!.phoneId.type = ["string", "null"];
  }

  if (config?.requiresCompany) {
    schema.required!.push("companyId", "addressId");
  } else {
    schema.properties!.companyId.type = ["string", "null"];
  }

  if (config?.requiresAddress && !config?.requiresCompany) {
    schema.required!.push("addressId");
  } else {
    schema.properties!.addressId.type = ["string", "null"];
  }

  return schema as unknown as JsonSchema;
};

export const useUischema = ({ config }: BillingContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "ControlBilling",
        scope: "#/properties",
        i18n: "basket.billing",
        label: "",
        options: {}
      }
    ]
  };

  if (!config?.requiresPhone) {
    remove(schema.elements, ["scope", "#/properties/phoneId"]);
  }

  if (config?.requiresCompany) {
    remove(schema.elements, ["scope", "#/properties/addressId"]);
  }

  if (!config?.requiresAddress && !config?.requiresCompany) {
    remove(schema.elements, ["scope", "#/properties/companyId"]);
  }

  return schema as UISchemaElement;
};
