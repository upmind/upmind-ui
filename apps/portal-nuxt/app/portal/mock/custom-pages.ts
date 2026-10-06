// -----------------------------------------------------------------------------
/**
 * @module portal/mock/custom-pages
 * @description The brand's own extra pages, as CONFIG (gap doc X15). A custom
 * page is data — the brand writes it, so the dataset carries it — but the
 * catch-all resolves paths against `PortalConfig.customAreas`, so the two meet
 * here: one pure function folding the dataset's pages into the shape's own
 * areas. `usePortalConfig` applies it to the active config; the resolver
 * (`routes.ts`) still takes a config and knows nothing about a dataset.
 */

import { defineCustomArea } from "../routes";
import { RESERVED_PILLAR_SEGMENT } from "../types";
import {
  assign,
  concat,
  filter,
  includes,
  isEmpty,
  map,
  values
} from "lodash-es";
import type { MockDataset } from "./types";
import type { CustomArea, PortalConfig } from "../types";
// -----------------------------------------------------------------------------

/** The dataset's pages as configured areas, in seeded order. */
export function datasetCustomAreas(
  data: MockDataset | undefined
): readonly CustomArea[] {
  // `defineCustomArea`'s guard only fires on a literal, and a seeded slug is a
  // plain string, so the reserved segments are rejected here or nowhere.
  const publishable = filter(
    data?.customPages ?? [],
    page => !includes(values(RESERVED_PILLAR_SEGMENT), page.slug)
  );
  return map(publishable, page =>
    defineCustomArea({ slug: page.slug, label: page.title })
  );
}

/** The shape's own areas plus the brand's pages; a brand with none is unchanged. */
export function withDatasetCustomAreas(
  config: PortalConfig,
  data: MockDataset | undefined
): PortalConfig {
  const areas = datasetCustomAreas(data);
  if (isEmpty(areas)) return config;
  return assign({}, config, {
    customAreas: concat([], config.customAreas, areas)
  });
}
