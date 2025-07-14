// --- utils
import { get } from "lodash-es";

// --- types
import { UnifiedType, type UnifiedContext } from "./types";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys } from "@upmind-automation/types";
import {
  useSchemaDefinitions as useAddressSchema,
  useUischemaDefinitions as useAddressUischema
} from "../../../client/address/schemas";

import {
  useSchema as useCompanySchema,
  useUischema as useCompanyUischema
} from "../../../client/company/schemas";

import {
  useSchema as usePhoneSchema,
  useUischema as usePhoneUischema
} from "../../../client/phone/schemas";

export const useSchema = ({
  clientId,
  countries,
  country,
  regions,
  addresses,
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

export const useUischema = ({ baseModel, type, config }: UnifiedContext) => {
  const uiSchema: Layout = {
    type: "VerticalLayout",
    elements: []
  };

  if (type == UnifiedType.PERSONAL) {
    uiSchema.elements.push(useAddressUischema());
  } else if (type == UnifiedType.BUSINESS) {
    uiSchema.elements.push({
      type: "Control",
      scope: "#/properties/company",
      options: {
        autoFocus: true,
        autocomplete: "off",
        detail: useCompanyUischema({
          minimal: true,
          baseModel: baseModel?.company
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
