// -----------------------------------------------------------------------------
/**
 * @module modules/catalogue/shell
 * @description The catalogue page template this app hands `@upmind-automation/catalogue`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import CatalogueFullTemplate from "./templates/CatalogueFull.template.vue";
import { CATALOGUE_TEMPLATE } from "./types";
import type { Component } from "vue";

export const CATALOGUE_TEMPLATES: Record<CATALOGUE_TEMPLATE, Component> = {
  [CATALOGUE_TEMPLATE.FULL]: CatalogueFullTemplate
};

export const catalogueTemplate = resolveTemplate(
  CATALOGUE_TEMPLATES,
  CATALOGUE_TEMPLATE.FULL
);
