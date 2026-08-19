import { BrandConfigKeys } from "@upmind-automation/types";
import {
  useSchemaDefinitions as useAddressSchema,
  useUischemaDefinitions as useAddressUischema
} from "../../client-address";
import { useCompanySchema, useCompanyUischema } from "../../client-company";
// @internal acknowledgement (row X2 / task T-6a, decision D-4): this file
// composes the phone schema into a LARGER schema at module scope, where no
// `useClientPhoneManager` instance exists to read it from machine context —
// the barrel's usual "schema reaches consumers via useContext()" route does
// not fit this one consumer. Reached by its deep internal path instead of
// re-exporting the pair from the barrel, which would re-open the hazard
// decision D-4 closed for every other consumer.
// eslint-disable-next-line @internal/no-cross-module-imports -- see comment above (row X2 / T-6a)
import {
  useSchema as usePhoneSchema,
  useUischema as usePhoneUischema
} from "../../client-phone/client-phone.schemas";
import { UnifiedType, type UnifiedContext } from "./types";
import { find, get, set } from "lodash-es";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";

export const useSchema = ({
  clientId: _clientId,
  countries,
  country,
  regions,
  addresses: _addresses,
  baseModel,
  config,
  type
}: UnifiedContext) => {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Unified Address",
    required: [],
    properties: {}
  };

  if (type == UnifiedType.BUSINESS) {
    // NB we still need this definition forcompanies
    schema.definitions = useAddressSchema({
      config,
      countries,
      regions,
      baseModel
    });

    schema.properties!.company = useCompanySchema({
      baseModel: baseModel?.company,
      countries,
      country,
      regions,
      config
    });
  }

  // NB: IF Company is required OR Address is Required then we need to enforce the company field when adding a bisiness address
  if (
    (type == UnifiedType.BUSINESS &&
      get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)) ||
    get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)
  )
    schema.required!.push("company");

  // ---
  if (type == UnifiedType.PERSONAL) {
    schema.definitions = useAddressSchema({
      config,
      countries,
      regions,
      baseModel
    });
    schema.properties!.address = { $ref: "#/definitions/address" };
  }
  // NB: IF the Address is Required then we need to enforce the address field when adding a personal address
  if (
    type == UnifiedType.PERSONAL &&
    get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS)
  ) {
    schema.required!.push("address");
  }

  // NB: IF the Phone is Required then we need to enforce the phone field when adding either a personal address or a business address
  if (get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)) {
    schema.required!.push("phone");
    schema.properties!.phone = usePhoneSchema({ country });
  }

  return schema;
};

export const useUischema = ({
  baseModel,
  type,
  config,
  regions,
  countries
}: UnifiedContext) => {
  const uiSchema: Layout = {
    type: "VerticalLayout",
    elements: []
  };

  if (type == UnifiedType.PERSONAL) {
    const addressSchema = useAddressUischema({ regions, countries });

    // NB: we want the ui to not show its required asterisk if the address is not required at checkout
    if (!get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS)) {
      const addressRenderer = find(addressSchema.options?.detail?.elements, [
        "type",
        "address"
      ]);
      if (addressRenderer)
        set(addressRenderer, "options.hideRequiredAsterisk", true);
    }
    uiSchema.elements.push(addressSchema);
  } else if (type == UnifiedType.BUSINESS) {
    uiSchema.elements.push({
      type: "Control",
      scope: "#/properties/company",
      options: {
        autoFocus: true,
        autocomplete: "off",
        detail: useCompanyUischema({
          minimal: true,
          baseModel: baseModel?.company,
          countries,
          regions
        })
      }
    } as any);
  }

  if (get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)) {
    uiSchema.elements.push({
      type: "Control",
      scope: "#/properties/phone",
      options: {
        detail: usePhoneUischema()
      }
    } as any);
  }

  return uiSchema as UISchemaElement;
};
