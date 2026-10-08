/** @internal */
import { RuleEffect } from "@jsonforms/core";
import {
  ContractStatusCodes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import {
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "../client-custom-fields";
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { mapBillingEntityOptions } from "./contract-product.mappers";
import {
  ContractProductCancelOption,
  ContractProductsSortableProperties,
  DEFAULT_SORT,
  MigrationModelOmittedFields
} from "./contract-product.types";
import {
  compact,
  isEmpty,
  map,
  omit,
  reject,
  some,
  startsWith,
  values,
  without
} from "lodash-es";
import type { CustomField } from "../client-custom-fields";
import type {
  BillingEntityLists,
  ContractProduct,
  ContractProductLayout,
  ContractProductPickerLookupService,
  ContractProductsQuerySchema
} from "./contract-product.types";
import type {
  ControlElement,
  JsonSchema7,
  Layout,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.schemas
 * @description The collection's query schema family (filters, sort and
 * pagination as one Draft-07 schema, the filter-bar uischema and the sort
 * uischema), the product picker, and the manager's write forms. Each form's
 * builder runs in the machine's open transition, which sets that form's own
 * slot on context.
 */

/**
 * One `billing_cycle_days` branch carries both operator leaves (`neq` for
 * `subscriptionsOnly` and the forced hide-one-time leaf, `eq` for
 * `oneTimeOnly`). A bare column declares no operator, so the translator emits
 * `filter[column]`. The forced hide-one-time leaf is a `const` and a
 * `default`, because a `const` alone injects nothing into an empty model.
 */
export function useQuerySchema(): ContractProductsQuerySchema {
  const forced =
    useBrand().portal.value?.["@context.oneTimePurchases"] === "hidden";

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          "product.name": useLikeFilterSchema("text.product_name"),
          "product.category.name": useLikeFilterSchema("text.category_name"),
          "product.category.id": {
            type: ["string", "null"],
            title: "text.category"
          },
          "status.code": { type: ["string", "null"], title: "text.status" },
          billing_cycle_days: {
            type: "object",
            title: "text.billing_cycle",
            additionalProperties: false,
            // Mutually exclusive operators on ONE wire column — a client
            // never picks Subscriptions AND One-time at once.
            not: { required: ["neq", "eq"] },
            // Forced, `eq` is undeclared: the parser drops a one-time ask, so
            // the brand's hide outranks it.
            properties: forced
              ? { neq: { type: "integer", const: 0, default: 0 } }
              : {
                  neq: { type: ["integer", "null"], enum: [0, null] },
                  eq: { type: ["integer", "null"], enum: [0, null] }
                }
          },
          created_at: useDateFilterSchema("text.purchase_date"),
          next_due_date: useDateFilterSchema("text.next_due_date"),
          total_amount: { type: ["number", "null"], title: "text.price" }
        }
      },
      query: { type: ["string", "null"], minLength: 3 },
      sort: {
        type: "array",
        default: DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: useSortItemSchema(values(ContractProductsSortableProperties))
      },
      pagination: usePaginationSchema()
    }
  };
}

function usePaginationSchema(): JsonSchema7 {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
      offset: { type: "integer", minimum: 0, default: PAGINATION.offset }
    }
  };
}

/** A text-search filter leaf: the `like` operator over one wire column. */
function useLikeFilterSchema(title: string): JsonSchema7 {
  return {
    type: "object",
    title,
    additionalProperties: false,
    properties: { like: { type: ["string", "null"], minLength: 1 } }
  };
}

/** A date filter leaf: the `gt` operator over one wire column. */
function useDateFilterSchema(title: string): JsonSchema7 {
  return {
    type: "object",
    title,
    additionalProperties: false,
    properties: { gt: { type: ["string", "null"], format: "date" } }
  };
}

/** One sort entry: a `field` of the declared vocabulary, and a direction. */
function useSortItemSchema(fields: string[]): JsonSchema7 {
  return {
    type: "object",
    additionalProperties: false,
    required: ["field", "dir"],
    properties: {
      field: { enum: fields },
      dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
    }
  };
}

/**
 * The collection's filter-bar presentation. The top-level `query` box is the
 * quick search; the rest scope operator leaves of `useQuerySchema()`'s
 * `filters` branch, so each leaf's own write is the wire shape.
 * `billing_cycle_days` is ONE three-way toggle over the whole operator object
 * (All │ Subscriptions │ One-time) — never two independent
 * toggles — and its option labels resolve through the element's `i18n`
 * prefix. In the forced case the one-time position is not offered, and
 * `neq` is the const seam that position would have written.
 */
export function useQueryUischema(): Layout {
  const forced =
    useBrand().portal.value?.["@context.oneTimePurchases"] === "hidden";
  const controls: ControlElement[] = [
    {
      type: "Control",
      scope: "#/properties/query",
      i18n: "form.contract_product_search",
      options: SEARCH_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/product.name/properties/like",
      i18n: "form.contract_product_name_search",
      options: SEARCH_OPTIONS
    },
    {
      type: "Control",
      scope:
        "#/properties/filters/properties/product.category.name/properties/like",
      i18n: "form.contract_product_category_name",
      options: SEARCH_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/product.category.id",
      i18n: "form.contract_product_category",
      options: LABELLESS_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/status.code",
      i18n: "form.contract_product_status",
      options: LABELLESS_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/total_amount",
      i18n: "form.contract_product_price",
      options: OPTIONAL_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/created_at/properties/gt",
      i18n: "form.contract_product_date_purchased",
      options: OPTIONAL_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/next_due_date/properties/gt",
      i18n: "form.contract_product_next_due_date",
      options: OPTIONAL_OPTIONS
    },
    {
      type: "Control",
      scope: "#/properties/filters/properties/billing_cycle_days",
      i18n: "form.contract_product_subscription_type",
      options: {
        format: "filter-exclusive-toggle-group",
        noLabel: true,
        optionalText: "",
        items: [
          { member: "all" },
          { member: "subscriptions", key: "neq", value: 0 },
          ...(forced ? [] : [{ member: "one_time", key: "eq", value: 0 }])
        ]
      }
    }
  ];

  return { type: "FilterBar", elements: controls };
}

const SEARCH_OPTIONS: Record<string, unknown> = {
  format: "search",
  icon: "search-md",
  noLabel: true,
  optionalText: ""
};

const LABELLESS_OPTIONS: Record<string, unknown> = {
  noLabel: true,
  optionalText: ""
};

const OPTIONAL_OPTIONS: Record<string, unknown> = { optionalText: "" };

/** The collection's ORDERING presentation — one element over the `sort` branch. */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.contract_product_sort"
  };
}

/**
 * The dashboard grouped-count read's OWN request state. No
 * consumer narrows it: the active-status filter and the `service_identifier`
 * ordering are the SHAPE of that read, so each is a forced leaf — a `const`
 * AND a `default` — and the read parses an empty model against it.
 * The brand's forced hide-one-time leaf rides here too.
 * `service_identifier` is declared ONLY here; `useQuerySchema()`'s
 * client-facing sort vocabulary omits it, because the products list cannot
 * honour a sort the client could then pick.
 */
export function useGroupedCountsQuerySchema(): ContractProductsQuerySchema {
  const forced =
    useBrand().portal.value?.["@context.oneTimePurchases"] === "hidden";

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          "status.code": {
            type: "string",
            const: ContractStatusCodes.ACTIVE,
            default: ContractStatusCodes.ACTIVE
          },
          ...(forced && {
            billing_cycle_days: {
              type: "object",
              additionalProperties: false,
              properties: { neq: { type: "integer", const: 0, default: 0 } }
            }
          })
        }
      },
      sort: {
        type: "array",
        default: [{ field: "service_identifier", dir: SortDirection.ASC }],
        minItems: 1,
        maxItems: 1,
        uniqueItems: true,
        items: useSortItemSchema(["service_identifier"])
      }
    }
  };
}

// -----------------------------------------------------------------------------
// The product picker: the client's own contract products.
// -----------------------------------------------------------------------------

/**
 * The manager page's product-finder — a searchable lookup over the client's
 * own contract products, keyed by the id `useContractProduct` loads by.
 * Distinct from the query family above: this finds ONE product, it does not
 * narrow the list.
 */
export function useContractProductPickerSchema(): ContractProductsQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      contractProduct: { type: ["string", "null"] }
    }
  };
}

export function useContractProductPickerUischema(
  lookup: ContractProductPickerLookupService
): ContractProductLayout {
  return {
    type: "VerticalLayout",
    i18n: "form.contract_product_lookup",
    elements: [
      {
        type: "Control",
        scope: "#/properties/contractProduct",
        i18n: "form.contract_product_lookup",
        options: {
          lookup: {
            service: lookup,
            searchScope: "filters.service_identifier.like"
          },
          optionalText: ""
        }
      }
    ]
  };
}

/** The picker lookup's OWN criteria — a `service_identifier` search. */
export function useContractProductPickerQuerySchema(): ContractProductsQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          service_identifier: {
            type: "object",
            additionalProperties: false,
            properties: { like: { type: ["string", "null"], minLength: 1 } }
          }
        }
      },
      pagination: usePaginationSchema()
    }
  };
}

/**
 * The billing-entity form's model: the picked address or company id, chosen
 * from the client's own addresses and companies. It opens on the entity the
 * contract bills to now. `oneOf` is left off while neither list holds an
 * entry, since an empty `oneOf` is not a valid schema.
 */
export function useBillingEntitySchema(
  { addresses, companies }: BillingEntityLists,
  product?: Pick<ContractProduct, "billingAddressId" | "billingCompanyId">
): JsonSchema7 {
  const options = mapBillingEntityOptions(addresses, companies);
  const current = product?.billingCompanyId ?? product?.billingAddressId;

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["billing_entity"],
    properties: {
      billing_entity: {
        type: "string",
        ...(current ? { default: current } : {}),
        ...(isEmpty(options) ? {} : { oneOf: options })
      }
    }
  };
}

/** The billing-entity picker's one control. */
export function useBillingEntityUischema(): ContractProductLayout {
  return {
    type: "VerticalLayout",
    i18n: "form.contract_product_billing_entity",
    elements: [
      {
        type: "Control",
        scope: "#/properties/billing_entity",
        i18n: "form.contract_product_billing_entity",
        options: { optionalText: "" }
      }
    ]
  };
}

// -----------------------------------------------------------------------------
// WRITE SCHEMAS — one pair per model-taking write
// -----------------------------------------------------------------------------

/** The `setConsolidation` form over `SetConsolidationModel`. */
export function useSetConsolidationSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["invoiceConsolidationEnabled"],
    properties: {
      invoiceConsolidationEnabled: {
        type: "integer",
        title: "form.contract_product_invoice_consolidation",
        // Un-pressing either toggle position writes INHERIT through
        // `defaultOptionValue`.
        enum: [
          InvoiceConsolidationTypes.ENABLED,
          InvoiceConsolidationTypes.DISABLED,
          InvoiceConsolidationTypes.INHERIT
        ]
      }
    }
  };
}

export function useSetConsolidationUischema(): ContractProductLayout {
  return {
    type: "VerticalLayout",
    i18n: "form.contract_product_invoice_consolidation",
    elements: [
      {
        type: "Control",
        scope: "#/properties/invoiceConsolidationEnabled",
        i18n: "form.contract_product_invoice_consolidation",
        options: {
          format: "toggle-group",
          defaultOptionValue: InvoiceConsolidationTypes.INHERIT,
          optionalText: ""
        }
      }
    ]
  };
}

/** The client-label write over `ClientLabelModel`; an empty string clears the label. */
export function useClientLabelSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["client_label"],
    properties: { client_label: { type: "string", maxLength: 255 } }
  };
}

/**
 * The combined cancellation form over `CancellationModel`. `option` is a bare
 * enum of the options this product allows; the control's `i18n` key is the
 * option-key prefix, so each position labels through i18n.
 * `futureCancellationDate` is required only for `SCHEDULE_FUTURE` and floored
 * at the product's earliest selectable anniversary. `customFields` is the
 * brand's CANCEL_REQUEST catalogue, omitted when none are defined.
 */
export function useCancellationSchema({
  options,
  minDate,
  customFields
}: {
  options: ContractProductCancelOption[];
  minDate?: string | null;
  customFields?: CustomField[];
}): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["option"],
    properties: {
      option: {
        type: "string",
        title: "form.contract_product_cancellation_option",
        enum: options
      },
      futureCancellationDate: {
        type: "string",
        title: "form.contract_product_future_cancellation_date",
        format: "date",
        ...(minDate ? { formatMinimum: minDate, default: minDate } : {})
      },
      reason: { type: "string", title: "form.contract_cancellation_reason" },
      ...(!isEmpty(customFields) && {
        customFields: useCustomFieldsSchema(customFields)
      })
    },
    if: {
      properties: {
        option: { const: ContractProductCancelOption.SCHEDULE_FUTURE }
      }
    },
    then: { required: ["futureCancellationDate"] }
  };
}

export function useCancellationUischema(
  customFields?: CustomField[]
): ContractProductLayout {
  return {
    type: "VerticalLayout",
    i18n: "form.contract_product_cancellation_option",
    elements: [
      {
        type: "Control",
        scope: "#/properties/option",
        i18n: "form.contract_product_cancellation_option",
        options: { format: "radio" }
      },
      // Only relevant to SCHEDULE_FUTURE; hidden for the other options.
      {
        type: "Control",
        scope: "#/properties/futureCancellationDate",
        i18n: "form.contract_product_future_cancellation_date",
        rule: {
          effect: RuleEffect.SHOW,
          condition: {
            scope: "#",
            schema: {
              required: ["option"],
              properties: {
                option: { const: ContractProductCancelOption.SCHEDULE_FUTURE }
              }
            }
          }
        }
      },
      {
        type: "Control",
        scope: "#/properties/reason",
        i18n: "form.contract_cancellation_reason",
        options: {
          multi: true
        }
      },
      ...useCustomFieldsUischema(customFields)
    ]
  };
}

// -----------------------------------------------------------------------------
// Migration — the configurator form

/**
 * The configurator schema of a migration: no provision field and no trial
 * choice, and neither is required. The trial is a separate write.
 */
export function omitMigrationSchema(
  schema: JsonSchema7 | undefined
): JsonSchema7 | undefined {
  if (!schema) return schema;

  return {
    ...schema,
    properties: omit(schema.properties, values(MigrationModelOmittedFields)),
    ...(schema.required
      ? {
          required: without(
            schema.required,
            ...values(MigrationModelOmittedFields)
          )
        }
      : {})
  };
}

/** The configurator uischema of a migration: each element that draws a provision field or the trial choice is left out. */
export function omitMigrationUischema(
  element: UISchemaElement | undefined
): UISchemaElement | undefined {
  if (!element || !("elements" in element) || !element.elements) {
    return element;
  }

  return {
    ...element,
    elements: compact(
      map(
        reject(
          element.elements,
          child =>
            "scope" in child &&
            some(values(MigrationModelOmittedFields), field =>
              startsWith(child.scope, `#/properties/${field}`)
            )
        ),
        omitMigrationUischema
      )
    )
  };
}
