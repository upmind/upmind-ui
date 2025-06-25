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
        baseModel: {
          addressId: baseModel?.addressId,
          emailId: baseModel?.emailId,
          phoneId: baseModel?.phoneId,
        },
        countries,
        country,
        regions,
        config,
      }),
    },
  };

  if (get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS))
    schema.required!.push("address");

  if (get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS))
    schema.required!.push("company");

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
              baseModel: { addressId: baseModel?.addressId },
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
      rule: {
        effect: "SHOW",
        condition: {
          scope: "#/properties/company",
          schema: { type: "null" },
        },
      },
    } as any);
  }

  return uiSchema as UISchemaElement;
};
