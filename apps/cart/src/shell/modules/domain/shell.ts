// -----------------------------------------------------------------------------
/**
 * @module modules/domain/shell
 * @description The DAC page templates this app hands `@upmind-automation/domain`.
 */

import { DOMAIN_TEMPLATE } from "@upmind-automation/domain";
import { resolveTemplate } from "@upmind-automation/foundation";
import DomainFullTemplate from "./templates/DomainFull.template.vue";
import type { Component } from "vue";

export const DOMAIN_TEMPLATES: Record<DOMAIN_TEMPLATE.FULL, Component> = {
  [DOMAIN_TEMPLATE.FULL]: DomainFullTemplate
};

export const domainTemplate = resolveTemplate(
  DOMAIN_TEMPLATES,
  DOMAIN_TEMPLATE.FULL
);
