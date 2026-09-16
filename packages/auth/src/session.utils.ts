import { computed, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";
import { SESSION_TEMPLATE } from "./types";
import type { SessionViewProps } from "./types";

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

/**
 * How an accepted session leaves an auth screen. Call it before the view's own
 * `await`, as with any composable that injects.
 */
export function useSessionResolve(props: SessionViewProps) {
  const router = useRouter();
  const { navigateNext, meta: routingMeta } = useRoutingEngine();

  /**
   * A funnel host asks the engine for the step after this one. A host with no
   * funnel has no step to resolve — asking would leave the visitor on the form
   * that just accepted them — so it takes the landing that host named.
   */
  function navigateResolved() {
    const landing = props.landingRoute;

    if (landing && !routingMeta.value.hasFunnels) return router.push(landing);

    return navigateNext();
  }

  return { navigateResolved };
}
