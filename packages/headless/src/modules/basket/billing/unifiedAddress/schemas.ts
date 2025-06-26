// --- utils
import { get } from "lodash-es";

// --- types
import { UnifiedAddressType, type UnifiedAddressContext } from "./types";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys } from "@upmind-automation/types";
import {
  useSchema as useAddressSchema,
  useUischema as useAddressUischema,
} from "../../../client/address/schemas";

import {
  useSchema as useCompanySchema,
  useUischema as useCompanyUischema,
} from "../../../client/company/schemas";

import {
  useSchema as usePhoneSchema,
  useUischema as usePhoneUischema,
} from "../../../client/phone/schemas";

export const useSchema = ({
  clientId,
  countries,
  country,
  regions,
  addresses,
  baseModel,
  config,
  type,
}: UnifiedAddressContext) => {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Unified Address",
    required: [],
    properties: {
      phone: usePhoneSchema({
        country,
      }),
      address: useAddressSchema({
        clientId,
        regions,
        baseModel,
        countries,
        config,
      }),
      company: useCompanySchema({
        baseModel: baseModel?.company,
        countries,
        country,
        regions,
        config,
      }),
    },
  };

  // NB: IF Company is required OR Address is Required then we need to enforce the company field when adding a bisiness address
  if (
    (type == UnifiedAddressType.BUSINESS &&
      get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)) ||
    get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)
  )
    schema.required!.push("company");

  // NB: IF the Address is Required then we need to enforce the address field when adding a personal address
  if (
    type == UnifiedAddressType.PERSONAL &&
    get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)
  )
    schema.required!.push("address");

  // NB: IF the Phone is Required then we need to enforce the phone field when adding either a personal address or a business address
  if (get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS))
    schema.required!.push("phone");

  return schema;
};

export const useUischema = ({
  baseModel,
  type,
  config,
}: UnifiedAddressContext) => {
  const uiSchema: Layout = {
    type: "VerticalLayout",
    elements: [],
  };

  if (type == UnifiedAddressType.PERSONAL) {
    uiSchema.elements.push({
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/address",
          options: {
            autoFocus: true,
            autocomplete: "off",
            detail: useAddressUischema(),
          },
        },
      ],
    } as any);
  } else if (type == UnifiedAddressType.BUSINESS) {
    uiSchema.elements.push({
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/company",
          options: {
            autoFocus: true,
            autocomplete: "off",
            detail: useCompanyUischema({
              minimal: true,
              baseModel: baseModel?.company,
            }),
          },
        },
      ],
    } as any);
  }

  if (get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)) {
    uiSchema.elements.push({
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/phone",
          options: {
            detail: usePhoneUischema(),
          },
        },
      ],
    } as any);
  }

  return uiSchema as UISchemaElement;
};
