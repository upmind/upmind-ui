// --- utils
import { isEmpty, get, map } from "lodash-es";

// --- types
import type { UnifiedAddressContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useClientAddress } from "../../../client/address";
import { useClientCompany } from "../../../client/company";

export const useSchema = ({
  model,
  country,
  regions,
  addresses,
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
        applyDefaults: ["address"],
      },
      {
        title: "Business",
        $ref: "#/definitions/business",
        applyDefaults: ["address"],
      } as any,
    ],
    definitions: {
      company: {
        type: "object",
        title: "Company",
        properties: {
          addressId: {
            type: ["string", "null"],
            update: "updateAddressId",
            create: !isEmpty(addresses) ? "newAddressDialog" : null,
          } as any,
          companyId: {
            type: ["string", "null"],
            default: baseModel?.companyId || null,
            update: "updateCompanyId",
          } as any,
          companyName: {
            type: "string",
            title: "Company Name",
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
        default: {
          addressId: model?.addressId || baseModel?.addressId || null,
        },
      },
      address: {
        type: "object",
        title: "Address",
        additionalProperties: false,
        properties: {
          addressId: {
            type: ["string", "null"],
            default: baseModel?.addressId || null,
            update: "updateAddressId",
            create: !isEmpty(addresses) ? "newAddressDialog" : null,
          } as any,

          showAddressFields: {
            type: "boolean",
            default: false,
          },

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

          name: {
            type: ["string", "null"],
            title: "Address Name",
          },

          type: {
            type: ["number", "null"],
            title: "Address Type",
          },
        },
        required: ["address1", "city", "postcode", "countryId"],
      },
      personal: {
        type: "object",
        required: [],
        additionalProperties: false,
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
      business: {
        type: "object",
        required: ["company"],
        properties: {
          company: {
            $ref: "#/definitions/company",
          },
        },
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

  if (get(config, BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS)) {
    schema.definitions!.address!.required!.push("regionId");
  }

  if (get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS)) {
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
                      autocomplete: "address-line1",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/address2",
                    options: {
                      placeholder: "Road, street name etc.",
                      autocomplete: "address-line2",
                    },
                  },
                ],
              },
              {
                type: "Control",
                scope: "#/properties/city",
                options: {
                  placeholder: "City, town etc.",
                  autocomplete: "address-level2",
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
                      autocomplete: "address-level1",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/postcode",
                    options: {
                      placeholder: "eg. 10011",
                      autocomplete: "postal-code",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    rule: {
      effect: "HIDE",
      condition: {
        scope: "#/properties/address/properties/addressId",
        schema: { not: { const: null } },
      },
    },
  };

  const personalUiSchema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "ModelList",
        scope: "#/properties/address/properties/addressId",
        label: "Address",
        options: {
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
            scope: "#/properties/address/properties/addressId",
            schema: {
              not: { const: null },
            },
          },
        },
      },
      {
        ...addressUiSchema,
      },
    ],
  };

  const businessUiSchema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "ModelList",
        scope: "#/properties/company/properties/companyId",
        label: "Company",
        options: {
          oneOf: map(companies || [], item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            item: item,
          })),
        },
        rule: {
          effect: "HIDE",
          condition: {
            scope: "#/properties/company/properties/companyId",
            schema: { const: null },
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
                  default: "test",
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
                label: "Address",
                options: {
                  oneOf: map(addresses || [], item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    item: item,
                  })),
                },
                rule: {
                  effect: "HIDE",
                  condition: {
                    scope: "#",
                    schema: {
                      properties: {
                        addressId: { const: null },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        rule: {
          effect: "HIDE",
          condition: {
            scope: "#/properties/company/properties/companyId",
            schema: { not: { const: null } },
          },
        },
      },
      {
        ...addressUiSchema,
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
