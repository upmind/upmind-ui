// -----------------------------------------------------------------------------
/**
 * @module modules/catalogue/shell
 * @description The catalogue page template this package hands `@upmind-automation/catalogue`.
 */

import { validateTemplate } from "@upmind-automation/headless";
import CatalogueFullTemplate from "./templates/CatalogueFull.template.vue";
import { CATALOGUE_TEMPLATE } from "./types";
import type { Component } from "vue";

export const CATALOGUE_TEMPLATES: Record<CATALOGUE_TEMPLATE, Component> = {
  [CATALOGUE_TEMPLATE.FULL]: CatalogueFullTemplate
};

export function catalogueTemplate(template?: string): Component {
  return CATALOGUE_TEMPLATES[
    validateTemplate(template, CATALOGUE_TEMPLATE, CATALOGUE_TEMPLATE.FULL)
  ];
}
