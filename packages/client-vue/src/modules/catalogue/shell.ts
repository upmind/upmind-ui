// -----------------------------------------------------------------------------
/**
 * @module modules/catalogue/shell
 * @description The catalogue page template this package hands `@upmind-automation/catalogue`.
 */

import { CATALOGUE_TEMPLATE } from "@upmind-automation/catalogue";
import CatalogueFullTemplate from "./templates/CatalogueFull.template.vue";
import type { CatalogueTemplates } from "@upmind-automation/catalogue";

export const CATALOGUE_TEMPLATES: CatalogueTemplates = {
  [CATALOGUE_TEMPLATE.FULL]: CatalogueFullTemplate
};
