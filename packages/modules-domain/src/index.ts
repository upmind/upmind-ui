// -----------------------------------------------------------------------------
/**
 * @module domain
 * @description Domain search / DAC and the renderers that carry it into a form.
 */
import { registerFormRenderers } from "@upmind-automation/foundation";
import { domainRenderers } from "./renderers";

registerFormRenderers(domainRenderers);

// --- Export Views
export { default as UpmDomain } from "./components/Domain.vue";
export { default as UpmDac } from "./components/Dac.vue";
export { default as UpmSmartDomainField } from "./components/SmartDomainField.vue";
export { default as UpmDacWidget } from "./components/DacWidget.vue";

// --- Export Renderer Entries
export * from "./renderers";

// --- Export Types
export { DOMAIN_TEMPLATE, SMART_DOMAIN_CHOICES_ORDER } from "./types";
export type {
  DacProps,
  DomainActionsProps,
  DomainCardMeta,
  DomainCardProps,
  DomainCardSkeletonProps,
  DomainCardsProps,
  DomainProps,
  DomainSlotProps,
  DomainSummaryProps,
  DomainTemplates,
  SmartDomainDrawerProps,
  SmartDomainExistingProps,
  SmartDomainFieldProps,
  SmartDomainSummaryProps
} from "./types";
