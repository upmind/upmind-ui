// --- utils
import { filter, get, map, uniq } from "lodash-es";

// --- types
import type { UnifiedAddressContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useClientAddress } from "../../../client/address";
import { useClientCompany } from "../../../client/company";

// Use a conditional element as we only want the field to mount when there is a value
const conditionalElement = (condition: any, element: any) => {
  return condition ? [element] : [];
};

export const useSchema = ({
  country,
  regions,
  baseModel,
  countries,
  config,
}: UnifiedAddressContext) => {
  const schema: JsonSchema = {
    type: "object",
    oneOf: [
      {
        title: "Personal",
        $ref: "#/definitions/personal",
      },
      {
        title: "Business",
        $ref: "#/definitions/business",
      },
    ],
    definitions: {
      requireAddressId: {
        properties: {
          addressId: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["addressId"],
      },
      requireAddressDetails: {
        properties: {
          addressId: {
            type: ["null"],
          },
          address: {
            $ref: "#/definitions/requiredAddressFields",
          },
        },
        required: ["address"],
      },
      requireCompanyId: {
        properties: {
          companyId: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["companyId"],
      },
      requireCompanyDetails: {
        properties: {
          companyId: {
            type: ["null"],
          },
          company: {
            properties: {
              companyName: { type: "string", minLength: 3 },
            },
            required: ["companyName"],
          },
        },
        required: ["company"],
        anyOf: [
          { $ref: "#/definitions/requireCompanyAddressId" },
          { $ref: "#/definitions/requireCompanyAddressDetails" },
        ],
      },
      requireCompanyAddressId: {
        properties: {
          company: {
            properties: {
              addressId: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["addressId"],
          },
        },
      },
      requireCompanyAddressDetails: {
        properties: {
          company: {
            properties: {
              addressId: {
                type: ["null"],
              },
            },
          },
          address: { $ref: "#/definitions/requiredAddressFields" },
        },
        required: ["address"],
      },
      requiredAddressFields: {
        type: "object",
        properties: {
          address1: { type: "string", minLength: 3 },
          countryId: { type: "string", minLength: 1 },
          city: { type: "string", minLength: 3 },
          postcode: { type: "string", minLength: 3 },
        },
        required: ["address1", "countryId", "city", "postcode"],
        errorMessage: {
          properties: {
            address1: "Address must be at least 3 characters long",
            city: "City must be at least 3 characters long",
            postcode: "Postcode must be at least 3 characters long",
            countryId: "Please select a country",
          },
        },
      },
      company: {
        type: "object",
        title: "Company",
        properties: {
          addressId: {
            type: ["string", "null"],
            default: baseModel.addressId,
          },
          companyName: {
            type: "string",
            title: "Company Name",
            minLength: 3,
          },
          regNumber: {
            type: ["string", "null"],
            title: "Company Number",
          },
          vatNumber: {
            type: ["string", "null"],
            title: "Registered Tax ID",
          },
        },
        required: ["companyName"],
      },
      address: {
        type: "object",
        title: "Address",
        additionalProperties: true,
        properties: {
          address1: {
            type: ["string"],
            title: "Address",
          },

          address2: {
            type: ["string", "null"],
            title: "",
          },

          city: {
            type: ["string"],
            title: "City",
          },

          postcode: {
            type: ["string"],
            title: "Postal / Zip Code",
          },

          regionId: {
            type: ["string", "null"],
            title: "Region",
            oneOf: map(regions || [], item => ({
              const: item.id,
              title: item.name,
            })),
          },

          countryId: {
            type: "string",
            title: "Country",
            oneOf: map(countries || [], item => ({
              const: item.id,
              title: item.name,
            })),
          },
        },
        required: ["address1", "city", "postcode", "countryId"],
      },
      phone: {
        type: "object",
        title: "Phone number",
        isPhoneNumber: country?.code,
        default: baseModel?.phone,
        properties: {
          number: {
            type: ["string", "null"],
            title: "Phone number ( with dialing code )",
          },

          nationalNumber: {
            type: ["string", "null"],
            title: "Phone number",
          },

          countryCallingCode: {
            type: ["string", "null"],
            title: "Country calling code",
          },

          country: {
            type: ["string", "null"],
            title: "Country",
          },
        },
      } as any,
      personal: {
        type: "object",
        additionalProperties: true,
        properties: {
          type: {
            type: "number",
            enum: [1],
          },
          addressId: {
            type: ["string", "null"],
            default: baseModel.addressId,
          },
          companyId: {
            type: ["string", "null"],
            default: baseModel.companyId,
          },
          updateAddressId: {
            type: ["string", "null"],
            default: null,
          },
          updateCompanyId: {
            type: ["string", "null"],
            default: null,
          },
          address: {
            $ref: "#/definitions/address",
            default: {
              regionId: baseModel?.address?.regionId,
              countryId: baseModel?.address?.countryId,
            },
          },
          phone: {
            $ref: "#/definitions/phone",
          },
        },
        not: {
          required: ["company"],
        },
        anyOf: [
          { $ref: "#/definitions/requireAddressId" },
          { $ref: "#/definitions/requireAddressDetails" },
        ],
      },
      business: {
        type: "object",
        additionalProperties: true,
        properties: {
          type: {
            type: "number",
            enum: [4],
          },
          addressId: {
            type: ["string", "null"],
            default: baseModel.addressId,
          },
          companyId: {
            type: ["string", "null"],
            default: baseModel.companyId,
          },
          updateAddressId: {
            type: ["string", "null"],
            default: null,
          },
          updateCompanyId: {
            type: ["string", "null"],
            default: null,
          },
          company: {
            $ref: "#/definitions/company",
          },
          phone: {
            $ref: "#/definitions/phone",
          },
        },
        required: ["company"],
        anyOf: [
          { $ref: "#/definitions/requireCompanyId" },
          { $ref: "#/definitions/requireCompanyDetails" },
        ],
        allOf: [
          {
            if: {
              properties: {
                company: {
                  properties: {
                    addressId: { const: null },
                  },
                },
              },
            },
            then: {
              properties: {
                address: {
                  $ref: "#/definitions/address",
                  default: {
                    regionId: baseModel?.address?.regionId,
                    countryId: baseModel?.address?.countryId,
                  },
                },
              },
            },
          },
        ],
      },
    },
  };

  if (get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)) {
    //
  }

  if (get(config, BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS)) {
    schema.definitions!.address!.required!.push("regionId");
  }

  if (
    get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS) &&
    !baseModel.addressId
  ) {
    schema.oneOf?.shift();
  }

  return schema as JsonSchema;
};

export const useUischema = ({
  config,
  addresses,
  companies,
  model,
}: UnifiedAddressContext) => {
  const addressUiSchema = {
    type: "Control",
    scope: "#/properties/address",
    options: {
      autoFocus: true,
      autocomplete: "off",
      detail: {
        type: "VerticalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/countryId",
          },
          {
            type: "address",
            options: {
              fields: ["address1", "address2"],
              placeholder: "Start typing your address",
            },
            elements: [
              {
                type: "Group",
                options: {
                  border: false,
                },
                elements: [
                  {
                    type: "Control",
                    scope: "#/properties/address1",
                    options: {
                      placeholder: "House name, apartment number etc.",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/address2",
                    options: {
                      placeholder: "Road, street name etc.",
                    },
                  },
                ],
              },
              {
                type: "Control",
                scope: "#/properties/city",
                options: {
                  placeholder: "City, town etc.",
                },
              },
              {
                type: "HorizontalLayout",
                elements: [
                  {
                    type: "Control",
                    scope: "#/properties/regionId",
                    options: {
                      placeholder: "Select region",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/postcode",
                    options: {
                      placeholder: "eg. 10011",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  };

  const personalUiSchema = {
    type: "VerticalLayout",
    elements: [
      ...conditionalElement(get(model, "updateAddressId"), {
        type: "Model",
        scope: "#/properties/updateAddressId",
        label: "",
      }),
      {
        type: "ModelList",
        scope: "#/properties/addressId",
        options: {
          label: "Address",
          oneOf: map(addresses || [], item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            item: item,
          })),
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/properties/addressId",
            schema: {
              not: { const: null },
            },
          },
        },
      },
      {
        ...addressUiSchema,
        rule: {
          effect: "HIDE",
          condition: {
            scope: "#",
            schema: {
              required: ["addressId"],
              properties: {
                addressId: { not: { const: null } },
              },
            },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/phone",
      },
    ],
  };

  const businessUiSchema = {
    type: "VerticalLayout",
    elements: [
      ...conditionalElement(get(model, "updateCompanyId"), {
        type: "Model",
        scope: "#/properties/updateCompanyId",
        label: "",
      }),
      {
        type: "ModelList",
        scope: "#/properties/companyId",
        options: {
          label: "Company",
          oneOf: map(companies || [], item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            item: item,
          })),
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["companyId"],
              properties: {
                companyId: { not: { const: null } },
              },
            },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/company",
        options: {
          detail: {
            type: "VerticalLayout",
            elements: [
              {
                type: "Control",
                scope: "#/properties/companyName",
                options: {
                  placeholder: "Company Name",
                },
              },
              {
                type: "HorizontalLayout",
                elements: [
                  {
                    type: "Control",
                    scope: "#/properties/regNumber",
                    options: {
                      placeholder: "Registered tax or GST",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/vatNumber",
                    options: {
                      placeholder: "VAT Number",
                    },
                  },
                ],
              },
              {
                type: "ModelList",
                scope: "#/properties/addressId",
                options: {
                  label: "Address",
                  oneOf: map(addresses || [], item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    item: item,
                  })),
                },
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#/properties/addressId",
                    schema: {
                      not: { const: null },
                    },
                  },
                },
              },
            ],
          },
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["companyId"],
              properties: {
                companyId: { const: null },
              },
            },
          },
        },
      },
      {
        ...addressUiSchema,
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/properties/company/properties/addressId",
            schema: {
              const: null,
            },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/phone",
      },
    ],
  };

  const oneOfUiSchemas = [personalUiSchema, businessUiSchema];

  if (get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)) {
    oneOfUiSchemas.shift();
  }

  const uiSchema = {
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

  return uiSchema as UISchemaElement;
};
