import { computed, toValue, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";
import { AUTH_TEMPLATE } from "./types";
import type { SessionResolveOptions, SessionViewProps } from "./types";

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
    hasResolve: routingMeta.value.hasFunnels || !!props.landingRoute,
    hasReject: routingMeta.value.hasFunnels || !!toValue(options.rejectRoute)
  }));

  /**
   * The host mode decides first: a funnel host asks the engine for the step
   * after this one, and a funnel-free host takes the landing it named. A screen
   * with neither ends on itself, so the view holds its own step (`hasResolve`).
   */
  function navigateResolved() {
    if (routingMeta.value.hasFunnels) return navigateNext();

    const landing = props.landingRoute;
    // No funnel to ask and no landing named: this screen is the destination.
    if (!landing) return Promise.resolve();

    return router.push(landing);
  }

  /**
   * The same seam backwards: a funnel host takes the step before this one, and
   * a funnel-free host takes the screen's own back target. A screen naming none
   * renders no back control there (`hasReject`): its back is the basket.
   */
  function navigateRejected() {
    if (routingMeta.value.hasFunnels) return navigateBack();

    const reject = toValue(options.rejectRoute);
    // No funnel to ask and no back target: the control is not offered here.
    if (!reject) return Promise.resolve();

    return router.push(reject);
  }

  return { meta, navigateResolved, navigateRejected };
}
