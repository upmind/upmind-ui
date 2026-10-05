// -----------------------------------------------------------------------------
/**
 * @module modules/domain/shell
 * @description The DAC page templates this app hands `@upmind-automation/domain`.
 */

import { DOMAIN_TEMPLATE } from "@upmind-automation/domain";
import DomainFullTemplate from "./templates/DomainFull.template.vue";
import { get } from "lodash-es";
import type { Component } from "vue";

export const DOMAIN_TEMPLATES: Record<DOMAIN_TEMPLATE.FULL, Component> = {
  [DOMAIN_TEMPLATE.FULL]: DomainFullTemplate
};

export function domainTemplate(
  template: string = DOMAIN_TEMPLATE.FULL
): Component {
  return get(
    DOMAIN_TEMPLATES,
    template,
    DOMAIN_TEMPLATES[DOMAIN_TEMPLATE.FULL]
  );
}
