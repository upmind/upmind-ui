/** @internal */
import { PRODUCT_DEFAULT_SORT } from "./product-catalogue.types";
import { isArray, isEmpty, isNumber, isString, reduce } from "lodash-es";
import type {
  ProductCatalogueScope,
  ProductQueryModel
} from "./product-catalogue.types";
import type { QuerySchema } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module product-catalogue/product-catalogue.schemas
 * @description The collection's QUERY schema — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema over one model. A
 * SELF-CONTAINED JSON literal, so it can be lifted straight into ajv or a test
 * and run standalone.
 *
 * WARNING: Do not import directly from another module — the barrel exports no
 * schema.
 */
// -----------------------------------------------------------------------------

/**
 * The filters a `scope` forces, as the model values the `const` leaves of
 * {@link useQuerySchema} hold. Every value is a non-empty string, so the term 0
 * goes as `"0"`. The term is tested for a number, never for truth. The ids are
 * an operator-less array (`filter[id]=a,b`), absent when the scope names none.
 */
export function useScopeFilters(
  scope?: ProductCatalogueScope
): NonNullable<ProductQueryModel["filters"]> {
  const filters: NonNullable<ProductQueryModel["filters"]> = {};
  if (!scope) return filters;
  if (scope.ids && !isEmpty(scope.ids)) filters.id = [...scope.ids];
  if (isNumber(scope.billingCycleMonths))
    filters["prices.billing_cycle_months"] = String(scope.billingCycleMonths);
  if (scope.recurringOnly) filters.billing_cycle_months = { neq: "0" };
  if (scope.orderable) {
    filters.available_for_sales = "1";
    filters.clients_can_order = "1";
  }
  return filters;
}

/**
 * The storefront list. `products_category_id` takes the category and its
 * descendants as an id array; the search box binds `name.like`; the sort enum
 * is the API's own `order=` columns, so a column it does not name is
 * unspellable rather than an HTTP 500.
 */
export function useQuerySchema(scope?: ProductCatalogueScope): QuerySchema {
  const forced = useScopeFilters(scope);

  const forcedLeaves = reduce(
    forced,
    (leaves: Record<string, JsonSchema7>, value, column) => {
      if (isString(value)) {
        leaves[column] = { type: "string", const: value, default: value };
      } else if (isArray(value)) {
        leaves[column] = {
          type: "array",
          items: { type: "string" },
          const: value,
          default: value
        };
      } else if (value) {
        const neq = (value as { neq: string }).neq;
        leaves[column] = {
          type: "object",
          additionalProperties: false,
          properties: { neq: { type: "string", const: neq, default: neq } },
          default: value
        };
      }
      return leaves;
    },
    {}
  );

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        ...(isEmpty(forced) ? {} : { default: forced }),
        properties: {
          ...forcedLeaves,
          products_category_id: {
            type: "object",
            title: "text.categories",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["array", "null"],
                items: { type: "string" },
                uniqueItems: true
              }
            }
          },
          name: {
            type: "object",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: PRODUCT_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["order", "name", "price"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}
