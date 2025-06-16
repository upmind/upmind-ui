// --- internal

// --- utils
import { isEmpty, remove } from "lodash-es";

// --- types
import type { BillingContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { useClientAddresses } from "../../client/address";
import { useClientCompanies } from "../../client/company";

// -----------------------------------------------------------------------------

export const useSchema = ({ model }: BillingContext) => {
  const schema: JsonSchema = {
    type: "object",
    required: [] as string[],
    oneOf: [
      {
        type: "object",
        title: "Personal",
        required: ["addressId"],
      },
      {
        type: "object",
        title: "Business",
        required: ["companyId"],
      },
    ],
    properties: {
      addressId: {
        type: ["string", "null"],
        default: model?.addressId || null,
      },
      companyId: {
        type: ["string", "null"],
        default: model?.companyId || null,
      },
    },
  };

  return schema as unknown as JsonSchema;
};

export const useUischema = ({ model }: BillingContext) => {
  const oneOfUiSchemas = [
    {
      type: "ModelList",
      scope: "#/addressId",
      i18n: "basket.billing.addressId",
      options: {
        autoFocus: true,
        autocomplete: "off",
        use: useClientAddresses,
      },
    },

    {
      type: "ModelList",
      scope: "#/companyId",
      i18n: "basket.billing.companyId",
      options: {
        autoFocus: true,
        autocomplete: "off",
        use: useClientCompanies,
      },
    },
  ];

  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#",
        options: {
          toggle: true,
          oneOfUiSchema: oneOfUiSchemas,
        },
      },
    ],
  };

  // if (!config?.requiresPhone) {
  //   remove(schema.elements, ["scope", "#/properties/phone"]);
  // }

  return schema as UISchemaElement;
};
