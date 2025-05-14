// --- external

// --- internal
import { useBrand } from "../../brand";
import { useSystem } from "../../system";

// --- utils
import { get, remove } from "lodash-es";

// --- types
import { BrandConfigKeys } from "@upmind-automation/types";
import type { BillingDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = (_context: BillingDetailsContext) => {
  const { getConfig } = useBrand();
  const { getCountry } = useSystem();

  const phoneRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.CHECKOUT_REQUIRE_PHONE),
    BrandConfigKeys.CHECKOUT_REQUIRE_PHONE
  );

  const companyRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS),
    BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS
  );

  const addressRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS),
    BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS
  );

  const schema = {
    type: "object",
    title: "BillingDetails",
    required: [] as string[],
    phone: {
      type: ["object", "null"],
      title: "Phone",
      isPhoneNumber: getCountry()?.code,
      properties: {
        number: {
          type: ["string", "null"],
          title: "Phone number ( with dialing code )",
        },
        country: {
          type: ["string", "null"],
          title: "Country",
        },
        nationalNumber: {
          type: ["string", "null"],
          title: "Phone number",
        },
        countryCallingCode: {
          type: ["string", "null"],
          title: "Country calling code",
        },
      },
    },
    anyOf: [
      {
        type: "object",
        required: ["addressId"],
        properties: {
          addressId: {
            type: ["string", "null"],
          },
        },
      },
      {
        type: "object",
        required: ["companyId"],
        properties: {
          companyId: {
            type: ["string", "null"],
          },
        },
      },
    ],
  };

  if (phoneRequiredOnCheckout) {
    schema.required.push("phone");
  }
  if (companyRequiredOnCheckout) {
    schema.required.push("companyId");
  }
  if (addressRequiredOnCheckout) {
    schema.required.push("addressId");
  }

  return schema as unknown as JsonSchema;
};

export const useUischema = (_context: BillingDetailsContext) => {
  const { getConfig } = useBrand();

  const phoneRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.CHECKOUT_REQUIRE_PHONE),
    BrandConfigKeys.CHECKOUT_REQUIRE_PHONE
  );

  const companyRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS),
    BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS
  );

  const addressRequiredOnCheckout = get(
    getConfig(BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS),
    BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS
  );

  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/addressId",
        i18n: "basket.billingDetails.addressId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "Control",
        scope: "#/properties/companyId",
        i18n: "basket.billingDetails.companyId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "Control",
        scope: "#/properties/phone",
        i18n: "client.unified.form.fields.phone",
        options: {
          autocomplete: "tel",
          suggestions: true,
          itemLabel: "number",
          itemValue: "number",
          align: "start",
          side: "bottom",
        },
      },
    ],
  };

  if (!phoneRequiredOnCheckout) {
    remove(schema.elements, ["scope", "#/properties/phone"]);
  }
  if (!companyRequiredOnCheckout) {
    remove(schema.elements, ["scope", "#/properties/companyId"]);
  }
  if (!addressRequiredOnCheckout) {
    remove(schema.elements, ["scope", "#/properties/addressId"]);
  }

  return schema as UISchemaElement;
};
