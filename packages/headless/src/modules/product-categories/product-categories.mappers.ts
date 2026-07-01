/** @internal */
import { type UIMeta, UI_SCHEMA_DEFAULTS } from "../product/product.types";
import { iterateParents } from "../product/product.utils";
import { useTranslateField, useTranslateName } from "../../utils";
import { map, reduce, merge, sum } from "lodash-es";
import type { ProductCategory } from "./product-categories.types";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Parses the raw category data and transforms it into a structured `ProductCategory` object.
 *
 * @param {IProductCategory} raw - The raw product category data to be parsed.
 * @param {UIMeta} uiMeta - Optional brand UI meta to merge with category meta.
 *
 * @return {ProductCategory} The transformed and structured `ProductCategory` object containing
 * id, meta, name, excerpt, description, and products_count.
 */
export function parseProductCategory(
  raw: IProductCategory,
  uiMeta?: UIMeta
): ProductCategory {
  return {
    id: raw.id,
    name: raw.name, // untranslated name for reporting purposes
    title: useTranslateName(raw),
    description: useTranslateField(raw, "description"),
    excerpt: useTranslateField(raw, "short_description"),
    uiMeta: parseMeta(raw, uiMeta),
    count: raw.products_count ?? 0,

    countDeep: sum(
      iterateParents(raw, [], {
        valueKey: "products_count",
        parentKey: "subcategories",
        transform: (category: IProductCategory) => category?.products_count ?? 0
      })
    ),

    imageUrl: raw.image?.image_url,
    parent: raw.parent_id ?? undefined,
    children: map(raw.subcategories, child =>
      parseProductCategory(child, uiMeta)
    )
  } as ProductCategory;
}

export const parseMeta = (
  category?: IProductCategory,
  uiMeta?: UIMeta
): Record<string, any> => {
  uiMeta ??= {};

  const categoryMeta = iterateParents(category, [], {
    valueKey: "meta",
    parentKey: "top_category"
  });

  // Priority order: brand (lowest) → parent categories → current category (highest)
  // Start with brand meta, then merge each parent/current category meta
  let result = merge({}, uiMeta);

  result = reduce(
    categoryMeta,
    (result, categoryMetaItem) => {
      return merge({}, result, categoryMetaItem);
    },
    result
  );

  // Apply defaults if no value is provided
  if (result.uischema) {
    result.uischema = merge({}, UI_SCHEMA_DEFAULTS, result.uischema);
  }

  return result;
};
