import { computed, toValue, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";
import { AUTH_TEMPLATE } from "./types";
import type { AuthResolveOptions, AuthViewProps } from "./types";

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

/** Call it before the view's first `await`. */
export function useAuthResolve(
  props: AuthViewProps,
  options: AuthResolveOptions = {}
) {
  const router = useRouter();
  const { navigateNext, navigateBack, meta: routingMeta } = useRoutingEngine();

  const meta = computed(() => ({
    hasResolve: routingMeta.value.hasFunnels || !!props.landingRoute,
    hasReject: routingMeta.value.hasFunnels || !!toValue(options.rejectRoute)
  }));

  function navigateResolved() {
    if (routingMeta.value.hasFunnels) return navigateNext();

    const landing = props.landingRoute;
    if (!landing) return Promise.resolve();

    return router.push(landing);
  }

  function navigateRejected() {
    if (routingMeta.value.hasFunnels) return navigateBack();

    const reject = toValue(options.rejectRoute);
    if (!reject) return Promise.resolve();

    return router.push(reject);
  }

  return { meta, navigateResolved, navigateRejected };
}
