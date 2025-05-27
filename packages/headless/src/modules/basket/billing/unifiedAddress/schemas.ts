// --- utils
import { map, reduce } from "lodash-es";

// --- types
import { AddressTypes } from "../../../client";
import type { UnifiedAddressContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

export const useSchema = ({
  country,
  regions,
  baseModel,
  countries,
}: UnifiedAddressContext) => {
  const schema = {
    type: "object",
    properties: {
      details: {
        oneOf: [
          {
            $ref: "#/definitions/personal",
            title: "Personal",
          },
          {
            $ref: "#/definitions/business",
            title: "Business",
          },
        ],
      },
    },
    definitions: {
      company: {
        type: "object",
        title: "Company",
        properties: {
          name: {
            type: ["string", "null"],
            title: "Company Name",
          },
          regNumber: {
            type: ["string", "null"],
            title: "Company number",
          },
          vatNumber: {
            type: ["string", "null"],
            title: "Registered Tax ID",
          },
        },
      },
      address: {
        type: "object",
        title: "Address",
        default: {
          regionId: baseModel?.details?.address?.regionId,
          countryId: baseModel?.details?.address?.countryId,
        },
        required: ["address1", "city", "postcode", "countryId"],
        properties: {
          address1: {
            type: "string",
            title: "Address",
          },

          address2: {
            type: ["string", "null"],
            title: "",
          },

          city: {
            type: "string",
            title: "City",
          },

          postcode: {
            type: "string",
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
      },
      personal: {
        type: "object",
        title: "Personal",
        properties: {
          address: {
            $ref: "#/definitions/address",
          },
        },
      },
      business: {
        type: "object",
        title: "Business",
        properties: {
          company: {
            $ref: "#/definitions/company",
          },
          address: {
            $ref: "#/definitions/address",
          },
        },
        required: ["name"],
      },
    },
  };

  return schema as JsonSchema;
};

export const useUischema = ({
  emails,
  phones,
  addresses,
}: UnifiedAddressContext) => {
  const personalUiSchema = {
    type: "VerticalLayout",
    elements: [
      {
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
      },
    ],
  };

  const businessUiSchema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/company",
        options: {
          detail: {
            type: "VerticalLayout",
            elements: [
              {
                type: "Control",
                scope: "#/properties/name",
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
                      placeholder: "Company number",
                    },
                  },
                  {
                    type: "Control",
                    scope: "#/properties/vatNumber",
                    options: {
                      placeholder: "Registered Tax ID",
                    },
                  },
                ],
              },
            ],
          },
        },
      },

      personalUiSchema, // UI Schema doesn't support definitions
    ],
  };

  const uiSchema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        label: "",
        scope: "#/properties/details",
        options: {
          toggle: true,
          detail: {
            type: "VerticalLayout",
            elements: [],
          },
          oneOfUiSchema: [personalUiSchema, businessUiSchema],
        },
      },
    ],
  };

  return uiSchema as UISchemaElement;
};
