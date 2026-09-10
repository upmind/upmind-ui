<script setup lang="ts">
import { computed, watch } from "vue";
import { find, startCase } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { CatchAllResolution } from "~/portal/routes";
import type { PageKey } from "~/portal/types";
import { usePortalConfig } from "~/composables/usePortalConfig";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { routeQueryContext } from "~/portal/mock/injection";
import {
  setupAreaRedirect,
  soleProductRedirect
} from "~/portal/mock/selectors";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";
import { resolveCatchAll } from "~/portal/routes";
import { PAGE_KEY, PORTAL_PILLAR } from "~/portal/types";

const route = useRoute();
const { activeConfig, activeDatasetId } = usePortalConfig();

// The DATASET, not the shape (plan R9): the shape decides the arrangement,
// the dataset decides what the page is looking at — the same resolution
// `provideActiveMockData` makes for the modules below.
const activeData = computed(() => {
  const id = activeDatasetId.value;
  if (!isMockDatasetId(id)) return undefined;
  return useMockData(id);
});

const segments = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug : [];
});

const resolution = computed(() =>
  resolveCatchAll(activeConfig.value, segments.value)
);

const heading = computed(() => catchAllHeading(resolution.value));
const pageKeys = computed(() => catchAllPageKeys(resolution.value));
const routeContext = computed(() => catchAllRouteContext(resolution.value));

// A path that names nothing RENDERS the not-found page (gap doc §6): the
// silent replace-navigation to "/" left a client who mistyped an address on
// the dashboard with no way to tell what had happened. `immediate` covers
// first load; the watch covers a client-side navigation between two different
// catch-all paths, since this one component instance is reused across every
// unmatched-by-name route.
watch(
  resolution,
  async current => {
    if (current.kind === "unmatched") return;
    // A client who owns exactly one product in the group has no listing to
    // read; `replace` so Back still leaves the pillar rather than bouncing
    // off the redirect (mock/selectors.ts holds the decision).
    const sole = soleProductRedirect(activeData.value, current, queryFilters());
    if (sole !== undefined) await navigateTo(sole, { replace: true });
    // Setup is done: the tab is gone from the rail, so its URL goes too.
    const finished = setupAreaRedirect(activeData.value, current);
    if (finished !== undefined) await navigateTo(finished, { replace: true });
  },
  { immediate: true }
);

function catchAllHeading(resolution: CatchAllResolution): string {
  switch (resolution.kind) {
    case "group-listing":
      return resolution.group.label;
    case "group-order":
      return `${resolution.group.label} — Order`;
    case "product-detail":
      return productName(resolution.id);
    case "product-action-area":
      return `${productName(resolution.id)} — ${startCase(resolution.area)}`;
    case "custom-area":
      return resolution.area.label;
    case "unmatched":
      return "";
  }
}

/** The product's NAME heads its pages, as legacy's detail did — the id only when the dataset has no such product. */
function productName(productId: string): string {
  const product = find(activeData.value?.products ?? [], { id: productId });
  return product?.name ?? productId;
}

/**
 * Everything the route's QUERY carries, iterated off the context type itself
 * (`mock/injection.ts`) — this used to list four members by hand, so `?page=`
 * reached the thread selectors from nowhere and a long thread paged only by
 * typing the URL.
 */
function queryFilters(): DataRouteContext {
  return routeQueryContext(route.query);
}

/** The route position the data-ref selectors key off (mock/injection.ts). */
function catchAllRouteContext(
  resolution: CatchAllResolution
): DataRouteContext {
  switch (resolution.kind) {
    case "group-listing":
    case "group-order":
      return {
        groupSlug: resolution.group.slug,
        pillar: PORTAL_PILLAR.PRODUCTS,
        ...queryFilters()
      };
    case "product-detail":
      return {
        groupSlug: resolution.group.slug,
        pillar: PORTAL_PILLAR.PRODUCTS,
        productId: resolution.id
      };
    case "product-action-area":
      return {
        groupSlug: resolution.group.slug,
        productId: resolution.id,
        area: resolution.area
      };
    // The page's own slug IS its entity: the body and the frames both hang
    // off it (mock/selectors.ts `customPageMarkdown`).
    case "custom-area":
      return { entityId: resolution.area.slug };
    case "unmatched":
      return {};
  }
}

/** The resolution kind's candidate content keys, most-specific first (`resolve.ts` `PortalRoute.pageKeys`). */
function catchAllPageKeys(resolution: CatchAllResolution): readonly PageKey[] {
  switch (resolution.kind) {
    case "group-listing":
      return [PAGE_KEY.GROUP_LISTING];
    case "group-order":
      return [PAGE_KEY.GROUP_ORDER];
    case "product-detail":
      return [PAGE_KEY.PRODUCT_DETAIL];
    case "product-action-area":
      return [`product-area/${resolution.area}`, PAGE_KEY.PRODUCT_AREA];
    // A shape may compose one named page; every other slug renders the one
    // custom-page composition, fed by the slug's own refs.
    case "custom-area":
      return [`custom/${resolution.area.slug}`, PAGE_KEY.CUSTOM_PAGE];
    case "unmatched":
      return [PAGE_KEY.NOT_FOUND];
  }
}
</script>

<template>
  <PortalPageHost
    :page-keys="pageKeys"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>
