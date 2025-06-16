// -----------------------------------------------------------------------------

import { IProductCategory } from "@upmind-automation/types";
import { ProductCategory } from "./types";
import { useTranslateField, useTranslateName } from "../../utils";
import { iterateParents, parseMeta } from "../product/utils";
import { reverse } from "lodash-es";

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
    count: raw.products_count,

    // TODO: map our parents
    // TODO : map our children

    // categories: reverse(
    //   iterateParents(raw, [], {
    //     valueKey: "name",
    //     parentKey: "top_category",
    //     transform: useTranslateName,
    //   })
    // ) as string[],
  } as ProductCategory;
}
