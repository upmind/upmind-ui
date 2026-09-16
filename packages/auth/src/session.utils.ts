import { computed, toValue, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";
import { SESSION_TEMPLATE } from "./types";
import type { SessionResolveOptions, SessionViewProps } from "./types";

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
 * How an accepted or an abandoned session leaves an auth screen. Call it before
 * the view's own `await`, as with any composable that injects.
 */
export function useSessionResolve(
  props: SessionViewProps,
  options: SessionResolveOptions = {}
) {
  const router = useRouter();
  const { navigateNext, navigateBack, meta: routingMeta } = useRoutingEngine();

  const meta = computed(() => ({
    hasReject: routingMeta.value.hasFunnels || !!toValue(options.rejectRoute)
  }));

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

  /**
   * The same seam backwards: a funnel host takes the step before this one, and
   * a host with no funnel takes the screen's own back target. A screen naming
   * none renders no back control at all (`meta.hasReject`), because the step it
   * would return to is the basket, and a funnel-free host has no basket.
   */
  function navigateRejected() {
    const reject = toValue(options.rejectRoute);

    if (reject && !routingMeta.value.hasFunnels) return router.push(reject);

    return navigateBack();
  }

  return { meta, navigateResolved, navigateRejected };
}
