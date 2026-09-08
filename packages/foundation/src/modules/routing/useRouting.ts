import { computed } from "vue";
import { flowRegistrars, routeRecords } from "./routing.registry";
import type { Router } from "vue-router";

/**
 * The funnel/route socket every contributing package registers into. Empty
 * until a package's `feature.ts` contributes (ADR 023 §2 registry-ownership).
 */
export const useRouting = () => {
  const routes = computed(() => routeRecords.value);
  const flows = computed(() => flowRegistrars.value);

  return {
    routes,
    flows,

    /** Runs every registered flow contribution against the app's router. */
    register: (engine: Router) => {
      for (const flow of flowRegistrars.value) flow(engine);
    }
  };
};

export type UseRouting = ReturnType<typeof useRouting>;
