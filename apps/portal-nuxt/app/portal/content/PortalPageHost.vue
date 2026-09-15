<script setup lang="ts">
import { Page, PageDescription, PageHeader, PageTitle } from "@upmind/ui";
import { computed } from "vue";
import { assign } from "lodash-es";
import type { PortalPageHostProps } from "./types";
import { useInitAction } from "~/composables/useInitAction";
import { useMockActionRunner } from "~/composables/useMockActionRunner";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { areaForPath } from "~/portal/areas";
import PortalContent from "~/portal/content/PortalContent.vue";
import PortalRail from "~/portal/content/PortalRail.vue";
import { CONTENT_GUTTER, CONTENT_MEASURE } from "~/portal/content/types";
import {
  PAGE_BREADCRUMB_CLASS,
  PAGE_FOOTER_CLASS
} from "~/portal/content/variants";
import {
  injectActiveMockData,
  injectRouteContext,
  ROUTE_PRODUCT_QUERY_KEY,
  routeQueryContext,
  routeQueryValue,
  provideActiveMockData,
  provideRouteContext
} from "~/portal/mock/injection";
import { resolve } from "~/portal/resolve";
import PortalSlotContent from "~/portal/shell/PortalSlotContent.vue";
import { pageTrackClass } from "~/portal/shell/variants";

// The one thin host every page renders (settled OPEN-DECISION, 2026-08-26):
// the page names its structural position (`pageKeys`) and the active config
// answers with that position's content — or the singular fallback, exactly
// the pre-`pages` behaviour. Pages carry no markup of their own.
defineOptions({ name: "PortalPageHost" });

const props = defineProps<PortalPageHostProps>();

// The page's own subtree gets the active dataset and the route position for
// the data-ref seam (mock/injection.ts) — chrome gets its own from the layout.
provideActiveMockData();
const pageData = injectActiveMockData();

const { activeConfig } = usePortalConfig();
const route = useRoute();

/**
 * Everything the route's QUERY carries — the status tab, the thread's page,
 * and every other query-borne member, iterated off the context type itself
 * (`mock/injection.ts`). Every page reads them the same way: the catch-all
 * builds its own context and would otherwise be the only route where a rail
 * or a pager worked.
 */
const queryStatus = computed(() => routeQueryContext(route.query));

/**
 * The product a page was reached ABOUT (`?product=`) — a product's own
 * assistance link carries it to the new-ticket form, which opens with that
 * product already chosen. It is the one POSITION member a query may supply,
 * and the page's own context is merged last, so a route that names a product
 * in its PATH still wins.
 */
const queryProduct = computed(() => {
  const productId = routeQueryValue(route.query, ROUTE_PRODUCT_QUERY_KEY);
  if (productId === undefined) return {};
  return { productId };
});

// The layout's context (pillar, group) plus the page's own entity. Vue's
// inject takes the nearest provider and never merges, so re-providing the
// page's alone blanked `pillar` and `groupSlug` for every row on the page.
const inheritedRouteContext = injectRouteContext();
const injectedContext = computed(() =>
  assign(
    {},
    inheritedRouteContext.value,
    queryStatus.value,
    queryProduct.value,
    props.routeContext
  )
);
provideRouteContext(injectedContext);
// The SAME area override the layout applies to the chrome (portal/areas.ts):
// an `inline` utility renders through the page aside, so a shape's `areas`
// removal (the dashboard's rail) must reach this resolve too — without it the
// aside track stays reserved on pages the shape declared rail-less.
const resolvedShell = computed(() =>
  resolve(activeConfig.value, {
    pageKeys: props.pageKeys,
    area: areaForPath(activeConfig.value, route.path)
  })
);
const resolvedContent = computed(() => resolvedShell.value.content);

// Legacy's `?init=` deep link (composables/useInitAction.ts): a link that
// names a flow opens it once on arrival. It lives HERE rather than in a page
// because the route context every door reads is provided above, and every
// page renders this host.
const { run: runInitAction } = useMockActionRunner(
  () => pageData.value,
  () => injectedContext.value
);
useInitAction(runInitAction);

const meta = computed(() => ({
  // `Page` emits its OWN max-width from `width`, and `pageTrackClass` emits
  // one for the `outside` gutter — on the same element, two max-w-* classes
  // whose winner is decided by tailwind-merge order rather than anything
  // visible here. So an `outside` gutter hands `Page` the uncapped width and
  // keeps the cap in one place: the track class.
  pageWidth:
    resolvedContent.value.gutter === CONTENT_GUTTER.OUTSIDE
      ? CONTENT_MEASURE.FULL
      : resolvedContent.value.measure,
  pageTrackClass: pageTrackClass(
    resolvedContent.value.measure,
    resolvedContent.value.gutter
  ),
  // The route-aware heading (the catch-all's group/area label) outranks the
  // content entry's own title — a structural entry is shared across groups,
  // so its static title cannot name the group.
  // An empty heading is ABSENT, not a title — `??` passed "" straight through
  // and blanked the page's own name.
  title:
    props.heading === undefined || props.heading === ""
      ? resolvedContent.value.title
      : props.heading,
  showFooter: Boolean(resolvedContent.value.footer)
}));
</script>

<template>
  <Page :width="meta.pageWidth" :class="meta.pageTrackClass">
    <!-- Suppressed while the shape declares a hero — the band carries the h1 (PortalHero). -->
    <PageHeader v-if="!resolvedContent.hero">
      <div v-if="resolvedContent.breadcrumb" :class="PAGE_BREADCRUMB_CLASS">
        <PortalSlotContent :resolved-slot="resolvedContent.breadcrumb" />
      </div>
      <PageTitle>{{ meta.title }}</PageTitle>
      <PageDescription v-if="resolvedContent.description">{{
        resolvedContent.description
      }}</PageDescription>
    </PageHeader>

    <PortalRail :tertiary="resolvedShell.primitives.tertiary" />

    <PortalContent
      :rows="resolvedContent.rows"
      :aside="resolvedContent.aside"
      :aside-size="resolvedContent.asideSize"
      :aside-divider="resolvedContent.asideDivider"
      :aside-side="resolvedContent.asideSide"
      :aside-label="asideLabel"
    />

    <!-- Empty until the brand's own `footer` template slot lands (plan Phase 6). -->
    <div
      v-if="meta.showFooter"
      data-slot="page-footer"
      :class="PAGE_FOOTER_CLASS"
    ></div>
  </Page>
</template>
