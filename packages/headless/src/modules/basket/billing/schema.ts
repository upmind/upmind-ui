// --- internal

// --- utils
import { isEmpty, remove } from "lodash-es";

// --- types
import type { BillingContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { useUnifiedAddress } from "./unifiedAddress/useUnifiedAddress";

// -----------------------------------------------------------------------------

export const useSchema = ({ config }: BillingContext) => {
  const schema: JsonSchema = {
    type: "object",
    title: "BillingDetails",
    required: [] as string[],
    properties: {
      phoneId: {
        type: ["string", "null"],
      },
      addressId: {
        type: ["string", "null"],
      },
      companyId: {
        type: ["string", "null"],
      },
    },
  };

  const anyOfSchemas = [];

  if (config?.requiresAddress && !config.requiresCompany) {
    anyOfSchemas.push({
      type: "object",
      required: ["addressId"],
      properties: {
        addressId: {
          type: ["string", "null"],
        },
      },
    });
  }

  if (config?.requiresCompany) {
    anyOfSchemas.push({
      type: "object",
      required: ["companyId"],
      properties: {
        companyId: {
          type: ["string", "null"],
        },
      },
    });
  }

  if (!isEmpty(anyOfSchemas)) {
    schema.anyOf = anyOfSchemas;
  }

  if (config?.requiresPhone) {
    schema.required?.push("phoneId");
  }

  return schema as unknown as JsonSchema;
};

export const useUischema = ({ config }: BillingContext) => {
  const schema = {
    type: "ComposableLayout",
    use: useUnifiedAddress,
    elements: [
      {
        type: "ModelList",
        scope: "#/properties/addressId",
        i18n: "basket.billing.addressId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "ModelList",
        scope: "#/properties/companyId",
        i18n: "basket.billing.companyId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "ModelList",
        scope: "#/properties/phoneId",
        i18n: "client.unified.form.fields.phone",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
    ],
  };

  if (!config?.requiresPhone) {
    remove(schema.elements, ["scope", "#/properties/phone"]);
  }

  return schema as UISchemaElement;
};
