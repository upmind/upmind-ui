// --- utils
import { map, sum } from "lodash-es";
import { iterateParents, parseMeta } from "../product/utils";
import { useTranslateField, useTranslateName } from "../../utils";

// --- types
import type { IProductCategory } from "@upmind-automation/types";
import type { ProductCategory } from "./types";

// -----------------------------------------------------------------------------

/**
 * Parses the raw category data and transforms it into a structured `ProductCategory` object.
 *
 * @param {IProductCategory} raw - The raw product category data to be parsed.
 *
 * @return {ProductCategory} The transformed and structured `ProductCategory` object containing
 * id, meta, name, excerpt, description, and products_count.
 */
export function parseProductCategory(raw: IProductCategory): ProductCategory {
  return {
    id: raw.id,
    name: raw.name, // untranslated name for reporting purposes
    title: useTranslateName(raw),
    description: useTranslateField(raw, "description"),
    excerpt: useTranslateField(raw, "short_description"),
    uiMeta: parseMeta(raw?.meta ?? {}, raw),
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
    children: map(raw.subcategories, parseProductCategory)
  } as ProductCategory;
}
