import { computed, type Ref } from "vue";
import { AUTH_TEMPLATE } from "./types";

const INACTIVE_SECTION_TEMPLATES: AUTH_TEMPLATE[] = [
  AUTH_TEMPLATE.SPLIT,
  AUTH_TEMPLATE.CANVAS_CARD,
  AUTH_TEMPLATE.SURFACE_BOX
];

export function useAuthTemplates(template: Ref<AUTH_TEMPLATE>) {
  const meta = computed(() => ({
    hasActiveSection: !INACTIVE_SECTION_TEMPLATES.includes(template.value),
    hasMarkdownSlot: INACTIVE_SECTION_TEMPLATES.includes(template.value),
    isSplit: template.value === AUTH_TEMPLATE.SPLIT
  }));

  return { meta };
}
