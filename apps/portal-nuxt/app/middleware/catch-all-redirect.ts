// -----------------------------------------------------------------------------
/**
 * @module middleware/catch-all-redirect
 * @description Where a catch-all path stands for another — a group holding one
 * product, a finished Setup tab, a product root while setup is owed — the
 * redirect lands BEFORE the page renders. Fired from the page's own watcher
 * during the initial navigation, `navigateTo` moved the URL but left the
 * first page on screen. `mock/selectors.ts` (`catchAllRedirect`) holds the
 * decision; this holds the navigation.
 */

import type { MockDataset } from "~/portal/mock/types";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { routeQueryContext } from "~/portal/mock/injection";
import { catchAllRedirect } from "~/portal/mock/selectors";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";
import { resolveCatchAll } from "~/portal/routes";

function catchAllSegments(slug: string | string[] | undefined): string[] {
  if (Array.isArray(slug)) return slug;
  return [];
}

function activeMockData(id: unknown): MockDataset | undefined {
  if (!isMockDatasetId(id)) return undefined;
  return useMockData(id);
}

export default defineNuxtRouteMiddleware(to => {
  const { activeConfig, activeDatasetId } = usePortalConfig(to);
  const resolution = resolveCatchAll(
    activeConfig.value,
    catchAllSegments(to.params["slug"])
  );
  const target = catchAllRedirect(
    activeMockData(activeDatasetId.value),
    resolution,
    routeQueryContext(to.query)
  );
  if (target === undefined) return undefined;
  return navigateTo(target, { replace: true });
});
