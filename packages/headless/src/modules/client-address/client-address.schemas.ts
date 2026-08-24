/**
 * @public
 * @schema-fragment
 * @module client-address/client-address.schemas
 * @description Schema / uischema for the address form. They move as a PAIR: a
 * schema field with no control renders a required-but-invisible input.
 *
 * `useSchemaDefinitions` / `useUischemaDefinitions` are schema FRAGMENTS —
 * pure functions of their arguments, for composing the address form into a
 * PARENT schema (`client-company`, `basket-billing/unified`). A consumer
 * rendering the address form ITSELF must read
 * `useClientAddressManager().useContext().schema` / `.uischema`, which are the
 * schemas the machine actually validates against. The two fragment functions
 * are not a second route to the module's data and must never acquire one: no
 * scope, no session, no request, no reactive state (`design.md` D-6).
 *
 * Unlike every OTHER data-layer file in this module — each of which carries a
 * line-1 `@internal` marker — this one deliberately does not: it carries
 * `@public @schema-fragment` instead, because it is the one file this module
 * intentionally publishes on the barrel. That is a DOCUMENTED DEVIATION, and
 * this is its record:
 *
 * @decision D-6 / ruling R7 — the schema FRAGMENTS stay on the barrel.
 *
 * what: this file swaps its line-1 `@internal` for `@public
 *   @schema-fragment`, and `index.ts` exports `useSchemaDefinitions` /
 *   `useUischemaDefinitions`. The PARSERS `useSchema` / `useUischema` stay
 *   module-private and reach consumers only through
 *   `useClientAddressManager().useContext().schema` / `.uischema`.
 * why: four cross-module call sites compose the address DEFINITIONS into a
 *   larger schema at module scope, where no `useClientAddressManager` instance
 *   exists to read from machine context — `client-company.schemas.ts` (2
 *   sites) and `basket-billing/unified/schemas.ts` (3 sites). The barrel's
 *   usual "schema reaches consumers via `useContext()`" route does not fit
 *   them. This is exactly the definitions/parser split the hybrid template
 *   describes: definitions live in `useSchemaDefinitions()` /
 *   `useUischemaDefinitions()` and the parsers `$ref` them.
 * rejected: following the reference conversion's "NO SCHEMA EXPORTS HERE". It
 *   forces both consumers onto deep-path imports with an `eslint-disable` — a
 *   hazard already live in this tree for `client-phone`
 *   (`basket-billing/unified/schemas.ts` carries exactly that comment and
 *   disable). Reproducing it for a second module would be adopting a
 *   workaround as a convention.
 * precedent: `client-company` established and merged this shape. Schema
 *   fragments are PURE FUNCTIONS of their arguments — no scope, no session, no
 *   request, no reactive state — and must never acquire one. Divergence is
 *   explicit and authorised, and is NOT a precedent for a module without such
 *   a consumer.
 */
import { BrandConfigKeys } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { AddressTypes, ADDRESS_TYPE_KEYS } from "./client-address.types";
import { get, map } from "lodash-es";
import type { AddressContext } from "./client-address.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";

export function useSchemaDefinitions({
  regions,
  baseModel,
  countries,
  config
}: Partial<AddressContext> = {}): JsonSchema7["definitions"] {
  const schema = {
    address: {
      type: "object",
      title: "Address",
      required: ["address1", "city", "postcode", "countryId"],
      properties: {
        address1: {
          type: "string",
          title: "Address"
        },

        address2: {
          type: ["string", "null"],
          title: ""
        },

        city: {
          type: "string",
          title: "City"
        },

        postcode: {
          type: "string",
          title: "Postcode"
        },

        regionId: {
          type: ["string", "null"],
          title: "Region",
          ...(regions?.length &&
            Array.isArray(regions) && {
              enum: map(regions, "id"),
              options: regions.map(region => ({
                label: region.name,
                value: region.id
              }))
            })
        },

        countryId: {
          type: "string",
          title: "Country",
          // `baseModel.address.countryId`, not `baseModel.countryId` — the
          // latter is not a field on `AddressModel`, so the default always
          // resolved undefined and a blank draft opened with no country
          // selected (AC-16).
          default: baseModel?.address?.countryId,
          ...(countries?.length &&
            Array.isArray(countries) && {
              enum: map(countries, "id"),
              options: countries.map(country => ({
                label: country.name,
                value: country.id
              }))
            })
        }
      }
    }
  };

  // ensure we honor the brand config
  if (get(config, BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS)) {
    schema.address.required.push("regionId");
  }

  return schema;
}

export function useSchema({
  id,
  baseModel,
  config,
  countries,
  regions
}: AddressContext): JsonSchema7 {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Address",
    required: ["address"],
    definitions: useSchemaDefinitions({
      config,
      countries,
      regions,
      baseModel
    }),
    properties: {
      id: {
        type: ["string", "null"],
        title: "ID",
        description: "The AutoGenerated ID of this Address.",
        readOnly: true
      },

      name: {
        type: ["string", "null"],
        title: "Name",
        default: baseModel?.name
      },

      address: { $ref: "#/definitions/address" },

      // The address type a client picks when editing (`parity.yaml` L5 /
      // AC-22). Its control is emitted by `useUischema` on an EXISTING address
      // only, matching legacy's `v-if="formType === actionType.UPDATE"`
      // (`addEditAddressForm.vue:19-37`); on a create the property is
      // non-required and carries a HOME default, so nothing renders as a
      // required-but-invisible input and the created address still goes out as
      // type 1 — the wire value the pre-conversion mapper hardcoded.
      type: {
        type: "number",
        title: "Address Type",
        default: baseModel?.type ?? ADDRESS_TYPE_KEYS.HOME,
        oneOf: map(AddressTypes, item => ({
          const: item.key,
          title: item.value
        }))
      }
    }
  };

  // ensure that id we are editing an existing address, that we require the name
  if (id) {
    schema.required!.push("name");
  }

  return schema;
}

export function useUischemaDefinitions({
  id,
  config,
  countries: _countries,
  regions: _regions
}: Partial<AddressContext> = {}) {
  // Legacy locks the country on an address that already exists when the brand
  // forbids address updates — "the API rejects a country change on existing
  // addresses, so we lock the field" (`addEditClientAddressModal.vue:129-137`,
  // `parity.yaml` L4 / AC-21). Emitted only when locked: an unrecognised
  // `condition` evaluates as fulfilled in `@jsonforms/core`, so a DISABLE rule
  // present at all is a DISABLE rule in force.
  const lockCountry =
    !!id && get(config, BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE) === false;

  return {
    type: "Control",
    scope: "#/properties/address",
    i18n: "form.address",
    options: {
      autoFocus: true,
      autocomplete: "off",
      detail: {
        type: "VerticalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/countryId",
            i18n: "form.country",
            options: {
              placeholder: "Select a country…"
            },
            ...(lockCountry && {
              rule: {
                effect: "DISABLE",
                condition: { const: true }
              }
            })
          },
          // ---
          {
            type: id ? "VerticalLayout" : "address",
            i18n: "form.address",
            options: {
              fields: ["address1", "address2"],
              placeholder: "Start typing your address",
              autoFocus: true
            },
            elements: [
              {
                type: "Group",
                options: {
                  border: false
                },
                elements: [
                  {
                    type: "Control",
                    scope: "#/properties/address1",
                    i18n: "form.address1",
                    options: {
                      placeholder: "House name, apartment number etc.",
                      autocomplete: "address-line1",
                      autoFocus: true
                    }
                  },
                  {
                    type: "Control",
                    scope: "#/properties/address2",
                    i18n: "form.address2",
                    options: {
                      placeholder: "Road, street name etc.",
                      autocomplete: "address-line2"
                    }
                  }
                ]
              },
              {
                type: "Control",
                scope: "#/properties/city",
                i18n: "form.city",
                options: {
                  placeholder: "City, town etc.",
                  autocomplete: "address-level2"
                }
              },
              {
                type: "HorizontalLayout",
                elements: [
                  {
                    type: "Control",
                    scope: "#/properties/regionId",
                    i18n: "form.region",
                    options: {
                      placeholder: "Select a region…",
                      autocomplete: "address-level1"
                    }
                  },
                  {
                    type: "Control",
                    scope: "#/properties/postcode",
                    i18n: "form.postcode",
                    options: {
                      placeholder: "eg. 10011",
                      autocomplete: "postal-code"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };
}

export function useUischema({
  id,
  config,
  countries,
  regions
}: Partial<AddressContext> = {}): UISchemaElement {
  const elements: unknown[] = [
    useUischemaDefinitions({ id, config, countries, regions })
  ];

  // The `type` control's PAIR half (`parity.yaml` L5 / AC-22). It lives at the
  // ROOT, beside the address fragment, because `type` is a root property of
  // `AddressModel` — putting it inside `useUischemaDefinitions` would scope it
  // to `#/properties/type` INSIDE the address object, where no such property
  // exists, and would inject that broken control into every parent form that
  // composes the address fragment (`client-company`, `basket-billing/unified`).
  if (id) {
    elements.push({
      type: "Control",
      scope: "#/properties/type",
      i18n: "form.address_type",
      options: {
        placeholder: "Select an address type…"
      }
    });
  }

  const schema = {
    type: "VerticalLayout",
    elements
  };

  return schema as UISchemaElement;
}

// -----------------------------------------------------------------------------

/**
 * The collection's QUERY schema — its whole request state (filters · sort ·
 * pagination) as ONE Draft-07 schema over one model. A SELF-CONTAINED JSON
 * literal, so it can be lifted straight into ajv or a test and run standalone.
 *
 * Addresses are read whole for the billing surfaces that pick one, so
 * `limit: 0` asks for the unpaged read by default. The one declared filter is
 * the free-text search, bound to the `name` column the API indexes. Sort,
 * search and paging are additive capability here, not restored parity —
 * every legacy list GET in `__tests__/client-address.e2e-oracle.pre-migration.json`
 * (19 captured requests) sent no `order=` at all, so there is no legacy
 * sortable set to match. The two declared sort columns (`name`, `created_at`)
 * are this module's own choice: both are indexed, and `name` is already the
 * search column above.
 */
export function useQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "object",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "Verified",
            additionalProperties: false,
            properties: {
              // `null` is a MEMBER, not an absence: it is the value the unset
              // position writes, so a tri-state's clear has to validate, and it
              // is the enum entry whose label the control resolves.
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          },
          default: {
            type: "object",
            title: "Default",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          }
        }
      },
      sort: {
        type: "array",
        // No `minItems` paired with a `default` here (contrast
        // `client-email.schemas.ts`'s `sort`): a `default` was deliberately
        // dropped on review — no recorded fixture shows the endpoint
        // accepting an `order` column on the boot read (see
        // `client-address.criteria-defaults.int.test.ts`) — and `minItems: 1`
        // with NO default is the tension that leaves: an absent `sort` is
        // valid, but a JSONForms control that materialises the missing array
        // as `[]` grades that same boot state invalid against `minItems: 1`.
        // Omitted rather than re-paired with a default; an explicit `sort: []`
        // and an absent `sort` now mean the same thing — no ordering applied.
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["name", "created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The module's filter-bar presentation over the query schema. One Control
 * scoping the `name.like` filter — the address search, and the only filter
 * legacy exposes (`design.md` D1).
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/name/properties/like",
        i18n: "form.address_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "form.verified_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/default/properties/eq",
        i18n: "form.default_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/**
 * The collection's ORDERING presentation — one element over the query
 * schema's `sort` branch, mirroring `client-email.schemas.ts`'s
 * `useSortUischema`. Its `i18n` is also the option-key prefix: a field
 * resolves as `<i18n>.<field>` (`form.address_sort.created_at`).
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.address_sort"
  };
}
