<script setup lang="ts">
import {
  Button,
  Markdown,
  Toaster,
  TooltipProvider,
  provideFormEngineData,
  provideFormIcon
} from "@upmind/ui";
import { computed, nextTick, ref, watch } from "vue";
import { compact } from "lodash-es";
import { useMockActionRunner } from "~/composables/useMockActionRunner";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";
import { areaForPath } from "~/portal/areas";
import { MOCK_ACTION } from "~/portal/mock/actions";
import { portalFormEngineData } from "~/portal/mock/forms/engine-data";
import { useMockBrandGates } from "~/portal/mock/gates";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import {
  provideActiveMockData,
  provideRouteContext
} from "~/portal/mock/injection";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import { pillarForPath } from "~/portal/routes";
import PortalConfirmDialog from "~/portal/shell/PortalConfirmDialog.vue";
import PortalFormDialog from "~/portal/shell/PortalFormDialog.vue";
import PortalFormIcon from "~/portal/shell/PortalFormIcon.vue";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import PortalProseDialog from "~/portal/shell/PortalProseDialog.vue";
import {
  PORTAL_FOOTER_CLASS,
  PORTAL_FOOTER_LINK_CLASS,
  PORTAL_FOOTER_PROSE_CLASS
} from "~/portal/shell/variants";
import { PORTAL_PILLAR } from "~/portal/types";

const router = useRouter();
const route = useRoute();
const frame = ref<InstanceType<typeof PortalFrame> | null>(null);

const { activeConfig, activeDatasetId } = usePortalConfig();
const { setTheme } = useTheme();

// Chrome slots (sidebar, topbar, bottom bar) resolve data refs through this
// provider; the page's own subtree gets a fresh one from PortalPageHost.
provideActiveMockData();

// The form engine's two host seams (plan F7), installed above every form:
// the app's glyph component and the reference data no schema carries. Both
// degrade SILENTLY when absent — a form with no picker and no icons still
// renders — so they are provided once here rather than per form.
provideFormIcon(PortalFormIcon);
provideFormEngineData(portalFormEngineData());

// Chrome's own route context: the pillar, so the sidebar's contextual side
// menu resolves (mock/injection.ts). The PAGE host provides its own, richer
// context inside the page subtree.
provideRouteContext(
  computed(() => {
    const pillar = pillarForPath(activeConfig.value, route.path);
    // The products side menu is built from the group's own products, so the
    // rail needs the group slug — the pillar's own first path segment.
    const [head] = compact(route.path.split("/"));
    return {
      pillar,
      groupSlug: pillar === PORTAL_PILLAR.PRODUCTS ? head : undefined
    };
  })
);

// Legacy's impersonation ribbon, driven by the FLOW now (plan R10): logging
// in as a child account raises it with that child's name, and its own End
// control hands the verb back through the one action door.
const { isImpersonating, impersonatedName } = useMockImpersonation();

// The brand's own footer (gap doc X16): its `footer` template slot, and the
// platform line every brand that has not bought it out still carries.
const { footerMarkdown, hasUpmindBranding } = useMockBrandGates();

// The ribbon sits OUTSIDE the slot system, so it reaches the one action door
// directly rather than through a module's `select` emit — same runner, same
// toast-then-navigate ordering (composables/useMockActionRunner.ts).
const { run: runMockAction } = useMockActionRunner(
  () => {
    const id = activeDatasetId.value;
    if (!isMockDatasetId(id)) return undefined;
    return useMockData(id);
  },
  () => ({})
);

// tasks.md 6.0 — each shape carries its own brand, fed into the app's
// existing theme mechanism. Applied on every config switch (including the
// initial load), the same way a brand's own `preferredMode` already drives
// `useTheme`'s mode.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});

// design.md §D8's own board quote, exercised on real routes (tasks.md 6.4):
// a path beneath a configured product group loses the sidebar's primary nav
// for a quick-category rail and gains a secondary filter bar; every other
// route — including the group's own listing — keeps the active config
// unmodified. The selection itself lives in portal/areas.ts, shared with
// PortalPageHost so the chrome and the page content resolve the SAME area.
const activeArea = computed(() => areaForPath(activeConfig.value, route.path));

const resolvedShell = computed(() =>
  resolve(activeConfig.value, { area: activeArea.value })
);

// Move focus into <main> after each navigation (PortalFrame exposes focusMain()).
router.afterEach(() => {
  nextTick(() => frame.value?.focusMain());
});
</script>

<template>
  <TooltipProvider>
    <div
      v-if="isImpersonating"
      class="dark bg-surface text-display flex items-center justify-center gap-3 px-4 py-2 text-center text-sm"
      data-test-key="impersonation-ribbon"
    >
      <span>Viewing as {{ impersonatedName }}</span>
      <Button
        size="xs"
        variant="outline"
        data-test-key="impersonation-end"
        @click="runMockAction(MOCK_ACTION.END_IMPERSONATION)"
      >
        End
      </Button>
    </div>
    <PortalFrame
      ref="frame"
      :shell="resolvedShell"
      sidebar-label="Portal"
      sidebar-close-label="Close navigation"
      sidebar-back-label="Back"
      action-pane-label="Details"
      action-pane-close-label="Close details"
      action-pane-trigger-label="Open details"
      skip-label="Skip to content"
    >
      <slot />
      <template #footer>
        <div :class="PORTAL_FOOTER_CLASS">
          <Markdown
            v-if="footerMarkdown"
            tag="div"
            :model-value="footerMarkdown"
            :class="PORTAL_FOOTER_PROSE_CLASS"
          />
          <a
            v-if="hasUpmindBranding"
            :class="PORTAL_FOOTER_LINK_CLASS"
            href="https://upmind.com"
            target="_blank"
            rel="noreferrer"
            >Powered by Upmind</a
          >
        </div>
      </template>
    </PortalFrame>
    <Toaster />
    <PortalConfirmDialog cancel-label="Cancel" />
    <PortalFormDialog close-label="Close" />
    <PortalProseDialog close-label="Close" />
  </TooltipProvider>
</template>

<!-- The print routes (plan R11) print the DOCUMENT: the chrome around it is
     navigation, and navigation does not belong on paper. Unscoped, because
     the parts it hides are the library's own. -->
<style>
@media print {
  [data-slot="shell-sidebar"],
  [data-slot="shell-header"],
  [data-slot="shell-footer"],
  [data-slot="action-pane"],
  [data-slot="page-aside"] {
    display: none !important;
  }
}
</style>
