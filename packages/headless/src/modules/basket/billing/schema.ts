// --- internal
import { useUnifiedAddress } from "./unifiedAddress/useUnifiedAddress";

// --- types
import type { BillingContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { remove, unset } from "lodash-es";

// -----------------------------------------------------------------------------

export const useSchema = ({ model, config }: BillingContext) => {
  const schema: JsonSchema = {
    type: "object",
    required: [] as string[],
    properties: {
      addressId: {
        type: ["string", "null"],
        default: model?.addressId || null,
      },
      companyId: {
        type: ["string", "null"],
        default: model?.companyId || null,
      },
      phoneId: {
        type: ["string", "null"],
        default: model?.phoneId || null,
      },
    },
  };

  if (!config?.requiresPhone) {
    unset(schema, "properties.phoneId");
  }

  if (config?.requiresCompany) {
    unset(schema, "properties.addressId");
  }

  if (!config?.requiresAddress && !config?.requiresCompany) {
    unset(schema, "properties.companyId");
  }

  return schema as unknown as JsonSchema;
};

export const useUischema = ({ config }: BillingContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Tabs",
        elements: [
          {
            type: "ModelList",
            scope: "#/properties/addressId",
            i18n: "basket.billing.addressId",
            label: "Address",
            options: {
              type: "Address",
              composable: useUnifiedAddress,
              actions: {
                list: "addresses",
                mutate: "address",
              },
            },
          },
          {
            type: "ModelList",
            scope: "#/properties/companyId",
            i18n: "basket.billing.companyId",
            label: "Business",
            options: {
              type: "Business",
              composable: useUnifiedAddress,
              actions: {
                list: "companies",
                mutate: "company",
              },
            },
          },
        ],
      },
      {
        type: "ModelList",
        scope: "#/properties/phoneId",
        i18n: "basket.billing.phoneId",
        label: "",
        options: {
          type: "Phone",
          composable: useUnifiedAddress,
          actions: {
            list: "phones",
            mutate: "phone",
          },
        },
      },
    ],
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
