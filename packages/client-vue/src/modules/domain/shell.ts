// -----------------------------------------------------------------------------
/**
 * @module modules/domain/shell
 * @description The DAC page templates this package hands `@upmind-automation/domain`.
 */

import { DOMAIN_TEMPLATE } from "@upmind-automation/domain";
import DomainFullTemplate from "./templates/DomainFull.template.vue";
import type { DomainTemplates } from "@upmind-automation/domain";

export const DOMAIN_TEMPLATES: DomainTemplates = {
  [DOMAIN_TEMPLATE.FULL]: DomainFullTemplate
};
