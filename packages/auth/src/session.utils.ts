import { computed, type Ref } from "vue";
import { SESSION_TEMPLATE } from "./types";

const INACTIVE_SECTION_TEMPLATES: SESSION_TEMPLATE[] = [
  SESSION_TEMPLATE.SPLIT,
  SESSION_TEMPLATE.CANVAS_CARD,
  SESSION_TEMPLATE.SURFACE_BOX
];

export function useSessionTemplates(template: Ref<SESSION_TEMPLATE>) {
  const meta = computed(() => ({
    hasActiveSection: !INACTIVE_SECTION_TEMPLATES.includes(template.value),
    hasMarkdownSlot: INACTIVE_SECTION_TEMPLATES.includes(template.value),
    isSplit: template.value === SESSION_TEMPLATE.SPLIT
  }));

  return { meta };
}
