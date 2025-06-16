// --- internal
import { useClientAddress } from "../../client/address";
import { useClientAddresses } from "../../client/address";
import { useClientCompany } from "../../client/company";
import { useClientCompanies } from "../../client/company";

// --- types
import type { BillingContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = ({ model }: BillingContext) => {
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
    },
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
  };

  return schema as unknown as JsonSchema;
};

export const useUischema = ({ model }: BillingContext) => {
  const oneOfUiSchemas = [
    {
      type: "ModelList",
      scope: "#/properties/addressId",
      i18n: "basket.billing.addressId",
      options: {
        label: "Address",
        autoFocus: true,
        autocomplete: "off",
        use: useClientAddresses,
        modify: useClientAddress,
      },
    },
    {
      type: "ModelList",
      scope: "#/properties/companyId",
      i18n: "basket.billing.companyId",
      options: {
        label: "Business",
        autoFocus: true,
        autocomplete: "off",
        use: useClientCompanies,
        modify: useClientCompany,
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
