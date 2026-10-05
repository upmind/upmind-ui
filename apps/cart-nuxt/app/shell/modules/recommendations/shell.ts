// -----------------------------------------------------------------------------
/**
 * @module modules/recommendations/shell
 * @description The one page template this app hands `@upmind-automation/recommendations`.
 */

import { validateTemplate } from "@upmind-automation/headless";
import RecommendationsFullTemplate from "./templates/RecommendationsFull.template.vue";
import { RECOMMENDATIONS_TEMPLATE } from "./types";
import type { Component } from "vue";

export const RECOMMENDATIONS_TEMPLATES: Record<
  RECOMMENDATIONS_TEMPLATE,
  Component
> = {
  [RECOMMENDATIONS_TEMPLATE.FULL]: RecommendationsFullTemplate
};

export function recommendationsTemplate(template?: string): Component {
  return RECOMMENDATIONS_TEMPLATES[
    validateTemplate(
      template,
      RECOMMENDATIONS_TEMPLATE,
      RECOMMENDATIONS_TEMPLATE.FULL
    )
  ];
}
