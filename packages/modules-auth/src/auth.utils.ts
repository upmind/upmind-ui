import { computed, type Ref } from "vue";
import { AUTH_TEMPLATE } from "./types";
import { includes } from "lodash-es";

const INACTIVE_SECTION_TEMPLATES: AUTH_TEMPLATE[] = [
  AUTH_TEMPLATE.SPLIT,
  AUTH_TEMPLATE.CANVAS_CARD,
  AUTH_TEMPLATE.SURFACE_BOX
];

export function useAuthTemplates(template: Ref<AUTH_TEMPLATE>) {
  const meta = computed(() => ({
    hasActiveSection: !includes(INACTIVE_SECTION_TEMPLATES, template.value),
    hasMarkdownSlot: includes(INACTIVE_SECTION_TEMPLATES, template.value),
    isSplit: template.value === AUTH_TEMPLATE.SPLIT
  }));

  return { meta };
}
