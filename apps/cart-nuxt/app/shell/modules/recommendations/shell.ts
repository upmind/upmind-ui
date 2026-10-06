// -----------------------------------------------------------------------------
/**
 * @module modules/recommendations/shell
 * @description The one page template this app hands `@upmind-automation/recommendations`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import RecommendationsFullTemplate from "./templates/RecommendationsFull.template.vue";
import { RECOMMENDATIONS_TEMPLATE } from "./types";
import type { Component } from "vue";
// -----------------------------------------------------------------------------

export const RECOMMENDATIONS_TEMPLATES: Record<
  RECOMMENDATIONS_TEMPLATE,
  Component
> = {
  [RECOMMENDATIONS_TEMPLATE.FULL]: RecommendationsFullTemplate
};

export const recommendationsTemplate = resolveTemplate(
  RECOMMENDATIONS_TEMPLATES,
  RECOMMENDATIONS_TEMPLATE.FULL
);
