// --- utils
import { get } from "lodash-es";

// --- types
import { UnifiedType, type UnifiedContext } from "./types";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys } from "@upmind-automation/types";
import {
  useSchema as useAddressSchema,
  useUischema as useAddressUischema
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

  // NB: IF Company is required OR Address is Required then we need to enforce the company field when adding a bisiness address
  if (
    (type == UnifiedType.BUSINESS &&
      get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)) ||
    get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)
  ) {
    schema.required!.push("company");
    schema.properties!.company = useCompanySchema({
      baseModel: baseModel?.company,
      countries,
      country,
      regions,
      config
    });
  }

  // NB: IF the Address is Required then we need to enforce the address field when adding a personal address
  if (
    type == UnifiedType.PERSONAL &&
    get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS)
  ) {
    schema.required!.push("address");
    schema.properties!.address = useAddressSchema({
      clientId,
      regions,
      baseModel,
      countries,
      config
    });
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
    uiSchema.elements.push({
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/address",
          options: {
            autoFocus: true,
            autocomplete: "off",
            detail: useAddressUischema()
          }
        }
      ]
    } as any);
  } else if (type == UnifiedType.BUSINESS) {
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
              baseModel: baseModel?.company
            })
          }
        }
      ]
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
            detail: usePhoneUischema()
          }
        }
      ]
    } as any);
  }

  return uiSchema as UISchemaElement;
};
