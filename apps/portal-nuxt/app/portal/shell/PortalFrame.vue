<template>
  <Shell
    :default-collapsed="sidebarMeta.startsCollapsed"
    :ui="{ panel: [CHROME_PANEL_CLASS, bottomMeta.insetClass] }"
    :class="[
      CHROME_TRACK_CLASS,
      topbarHeightClass(props.shell.primitives.topbar?.height),
      props.class
    ]"
  >
    <ShellSkipLink :label="props.skipLabel" />

    <ShellSidebar
      v-if="sidebarMeta.renders"
      :label="props.sidebarLabel"
      :close-label="props.sidebarCloseLabel"
      collapsible="rail"
      :class="CHROME_SIDEBAR_CLASS"
    >
      <template #default="{ collapsed }">
        <!-- The `top` slot is the boards' NP.4 top region — the HEADER part,
             not the scroll content, so the brand rides the topbar's own
             height and the nav below starts on its own track. `border-b-0`:
             the references rule under the topbar, never under the brand. -->
        <ShellSidebarHeader
          v-if="sidebarMeta.hasHeader"
          :class="[
            'border-b-0',
            // A 3.5rem rail has no room for the expanded gutter: `px-6` leaves
            // 8px of track and the trigger renders 16px wide instead of 36.
            // The gap goes with it — the brand collapses to a zero-width
            // sr-only link, and a gap beside nothing still steals 8px.
            // Asymmetric when open, on purpose: the brand's wordmark lines
            // up with the nav's ICONS (24px in), while the trigger's box
            // lines up with the nav ROWS' right edge (12px in). One padding
            // value cannot do both, and a trigger short of the rows reads as
            // a gap.
            collapsed ? 'justify-center gap-0 px-2' : 'gap-2 ps-6 pe-3'
          ]"
        >
          <slot name="logo" :collapsed="collapsed" />
          <PortalSlotContent
            :resolved-slot="sidebarMeta.top"
            :collapsed="collapsed"
          />
          <ShellSidebarTrigger
            v-if="sidebarMeta.triggerInSidebar"
            :class="SIDEBAR_TRIGGER_CLASS"
          />
        </ShellSidebarHeader>
        <!-- flex column, so the middle wrapper's flex-1 actually pins the
             bottom slot low — the part itself only scrolls. -->
        <ShellSidebarContent class="flex flex-col">
          <div class="flex flex-1 flex-col gap-1">
            <PortalSidebarNav
              v-if="sidebarMeta.isNested"
              :items="nestedItems"
              :collapsed="collapsed"
              :path="nestedPath"
              :label="props.sidebarLabel"
              :back-label="props.sidebarBackLabel"
              @update:path="nestedPath = $event"
            />
            <PortalSlotContent
              v-else
              :resolved-slot="sidebarMeta.middle"
              :collapsed="collapsed"
            />
          </div>
          <div class="flex flex-col gap-1">
            <PortalSlotContent
              :resolved-slot="sidebarMeta.bottom"
              :collapsed="collapsed"
            />
          </div>
        </ShellSidebarContent>
        <ShellSidebarFooter v-if="slots['sidebar-footer']">
          <slot name="sidebar-footer" :collapsed="collapsed" />
        </ShellSidebarFooter>
      </template>
    </ShellSidebar>

    <ShellHeader
      v-if="topbarMeta.renders"
      :tone="topbarMeta.headerTone"
      data-level="primary"
      :class="[
        chromeLevelClass(CHROME_LEVEL.PRIMARY),
        topbarMeta.isFullBleed && FULL_BLEED_CLASS,
        topbarMeta.barClass
      ]"
    >
      <div :class="topbarMeta.innerClass">
        <ShellSidebarTrigger
          v-if="sidebarMeta.renders"
          :class="sidebarMeta.topbarTriggerClass"
        />
        <div class="flex min-w-0 items-center gap-3">
          <PortalSlotContent :resolved-slot="topbarMeta.left" />
        </div>
        <div class="flex min-w-0 flex-1 items-center justify-center gap-3">
          <PortalSlotContent :resolved-slot="topbarMeta.centre" />
        </div>
        <div class="flex shrink-0 items-center justify-end gap-3">
          <PortalSlotContent :resolved-slot="topbarMeta.right" />
        </div>
        <slot name="header-actions" />
        <!-- Only while the pane is actually off-canvas: a persistent pane at
             lg+ already shows its column, and a toggle whose aria-expanded
             flips with nothing expanded lies to assistive tech. -->
        <PortalButton
          v-if="utilityMeta.hasTrigger"
          variant="ghost"
          icon-only
          data-slot="action-pane-trigger"
          :aria-expanded="actionPaneOpen"
          :aria-controls="actionPaneId"
          :aria-label="props.actionPaneTriggerLabel"
          @click="actionPaneOpen = !actionPaneOpen"
        >
          <PanelRight aria-hidden="true" />
        </PortalButton>
      </div>
    </ShellHeader>

    <ShellHeader
      v-if="secondaryMeta.renders"
      data-level="secondary"
      :tone="topbarMeta.tone.tone"
      :style="secondaryMeta.stickyOffset"
      :class="[
        chromeLevelClass(CHROME_LEVEL.SECONDARY),
        topbarMeta.isFullBleed && FULL_BLEED_CLASS,
        topbarMeta.tone.class
      ]"
    >
      <div :class="measureClass">
        <div class="flex min-w-0 items-center gap-3">
          <PortalSlotContent :resolved-slot="secondaryMeta.left" />
        </div>
        <div class="flex min-w-0 flex-1 items-center justify-center gap-3">
          <PortalSlotContent :resolved-slot="secondaryMeta.centre" />
        </div>
        <div class="flex shrink-0 items-center justify-end gap-3">
          <PortalSlotContent :resolved-slot="secondaryMeta.right" />
        </div>
      </div>
    </ShellHeader>

    <ShellHeader
      v-if="tertiaryMeta.renders"
      data-level="tertiary"
      :tone="topbarMeta.tone.tone"
      :style="tertiaryMeta.stickyOffset"
      :class="[
        chromeLevelClass(CHROME_LEVEL.TERTIARY),
        topbarMeta.isFullBleed && FULL_BLEED_CLASS,
        topbarMeta.tone.class
      ]"
    >
      <div :class="measureClass">
        <div class="flex min-w-0 items-center gap-3">
          <PortalSlotContent :resolved-slot="tertiaryMeta.left" />
        </div>
        <div class="flex min-w-0 flex-1 items-center justify-center gap-3">
          <PortalSlotContent :resolved-slot="tertiaryMeta.centre" />
        </div>
        <div class="flex shrink-0 items-center justify-end gap-3">
          <PortalSlotContent :resolved-slot="tertiaryMeta.right" />
        </div>
      </div>
    </ShellHeader>

    <PortalActionPane
      v-if="utilityMeta.renders"
      :variant="utilityMeta.variant"
      :pane-id="actionPaneId"
      :label="props.actionPaneLabel"
      :close-label="props.actionPaneCloseLabel"
      :open="actionPaneOpen"
      @update:open="actionPaneOpen = $event"
    >
      <div :class="ACTION_PANE_BODY_CLASS">
        <PortalSlotContent :resolved-slot="utilityMeta.top" />
        <PortalSlotContent :resolved-slot="utilityMeta.topmid" />
        <PortalSlotContent :resolved-slot="utilityMeta.botmid" />
      </div>
      <div :class="ACTION_PANE_FOOT_CLASS">
        <PortalSlotContent :resolved-slot="utilityMeta.bottom" />
      </div>
    </PortalActionPane>

    <ShellMain ref="mainRef" :class="CHROME_MAIN_CLASS" :style="mainOffset">
      <PortalHero
        v-if="heroMeta"
        :hero="heroMeta"
        :title="props.shell.content.title"
        :description="props.shell.content.description"
        :measure="props.shell.content.measure"
        :gutter="props.shell.content.gutter"
      />
      <slot />
    </ShellMain>

    <ShellFooter v-if="slots.footer" :class="CHROME_FOOTER_CLASS">
      <slot name="footer" />
    </ShellFooter>

    <!-- Viewport-fixed, so it leaves the panel's flow entirely: the bar is
         `lg:hidden` and must reserve no track at desktop (variants.ts). -->
    <div
      v-if="bottomMeta.renders"
      data-slot="shell-bottom"
      :class="CHROME_BOTTOM_CLASS"
    >
      <PortalSlotContent :resolved-slot="bottomMeta.default" />
    </div>
  </Shell>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalFrame
 * @description Composes `Shell` directly — not `PortalShell` (design.md §D2)
 * — from a resolved config. Every chrome primitive renders here:
 * `topbar`/`secondary`/`tertiary` (§D4's three independently addressable
 * slots each, `full`/`inset` inherited uniformly from the topbar's own
 * variant per §D4's "a sub-bar carries no position variant of its own"),
 * `sidebar` (its `top`/`middle`/`bottom` slots and its
 * `default`/`nested`/`collapsible`/`hidden` variants — `floating` and
 * `internal` are rejected loudly, tasks.md Task 3b, ui-gaps.md), `utility` as
 * `ActionPane` plus its topbar-mounted `ActionPaneTrigger` (tasks.md 3.2 — the
 * pane's off-canvas state is bound here, not left uncontrolled, so the below-
 * `lg` drawer the pane already single-mounts is actually reachable), and
 * `bottom` as a curated strip in `Shell`'s dedicated `#bottom` region.
 *
 * The sidebar's `nested` variant is a SHELL-LEVEL rendering decision, not a
 * module concern: it reads the SAME `menu`-module item data
 * (`sidebar.middle`'s resolved `props.items`, now optionally tree-shaped,
 * modules/menu/types.ts) but mounts `SidebarNav` directly instead of
 * `PortalSlotContent`'s registry lookup, because only `SidebarNav` itself
 * carries the drill-down/back-row/focus machinery a nested tree needs.
 * `path` is bound, not left uncontrolled: `ShellSidebar` remounts its slot
 * content across the `lg` breakpoint (a `v-if`/`v-else` pair, `ShellSidebar.vue`),
 * discarding any state the nav would otherwise keep for itself.
 *
 * The logo, header-actions and sidebar-footer slots exist because the board's
 * config vocabulary has no "identity"/"utility" module registered yet
 * (Task 5) to occupy `topbar.left`/`sidebar.top` for them — they are native
 * Vue slots for content the framework does not model yet, not a second
 * chrome-declaration surface: the NAVIGATION structure (which primitives
 * render, their variants, their slot assignments) comes from `shell` alone.
 */
import {
  Button as PortalButton,
  Shell,
  ShellFooter,
  ShellHeader,
  ShellMain,
  ShellSidebar,
  ShellSidebarContent,
  ShellSidebarFooter,
  ShellSidebarHeader,
  ShellSidebarTrigger,
  ShellSkipLink,
  useSlots
} from "@upmind/ui";
import { PanelRight } from "lucide-vue-next";
import { computed, ref, useId, watchEffect } from "vue";
import PortalHero from "../content/PortalHero.vue";
import { resolveDataRefProps } from "../mock/data-refs";
import { injectActiveMockData, injectRouteContext } from "../mock/injection";
import PortalActionPane from "./PortalActionPane.vue";
import PortalSidebarNav from "./PortalSidebarNav.vue";
import PortalSlotContent from "./PortalSlotContent.vue";
import { ACTION_PANE_VARIANT, CHROME_LEVEL } from "./types";
import {
  ACTION_PANE_BODY_CLASS,
  ACTION_PANE_FOOT_CLASS,
  CHROME_BOTTOM_CLASS,
  CHROME_BOTTOM_INSET_CLASS,
  CHROME_FOOTER_CLASS,
  CHROME_MAIN_CLASS,
  CHROME_PANEL_CLASS,
  CHROME_SIDEBAR_CLASS,
  CHROME_TRACK_CLASS,
  SIDEBAR_TRIGGER_CLASS,
  FLOATING_TOPBAR_BAR_CLASS,
  floatingTopbarInnerClass,
  chromeLevelClass,
  chromeMeasureClass,
  chromeStickyOffset,
  chromeToneMeta,
  topbarHeightClass
} from "./variants";
import { filter } from "lodash-es";
import type { MenuItem } from "../modules/menu/types";
import type { ResolvedPrimitive, ResolvedSlot } from "../resolve";
import type { ActionPaneVariant } from "./types";
import type { PortalFrameProps, PortalFrameSlots } from "./types";
import { useLgViewport } from "~/composables/useLgViewport";

defineOptions({ name: "PortalFrame" });

const props = defineProps<PortalFrameProps>();

// The data-ref seam's inputs for the nested rail's own props read (below).
const activeData = injectActiveMockData();
const routeContext = injectRouteContext();

defineSlots<PortalFrameSlots>();

const slots = useSlots();

// The one chrome breakpoint (composables/useLgViewport.ts): it decides whether
// the utility pane shows its column or its drawer, and therefore whether the
// topbar's trigger has anything off-canvas to open.
const isDesktop = useLgViewport();
const actionPaneId = useId();

// ShellHeader's own default already starts at the sidebar's right edge
// (`lg:col-start-2` — "inset"). `full` is the one look that differs: it
// spans both grid columns, bleeding across the sidebar too (design.md §D4,
// AC3.2). Every other named variant (`inset`, and — not yet distinguished —
// `docked`/`floating`/`mobile`) keeps ShellHeader's built-in behaviour. Every
// bar (topbar, secondary, tertiary) shares this SAME class, driven by the
// TOPBAR's own variant alone — §D4: a sub-bar carries no position variant of
// its own, so its placement follows whatever the topbar chose.
const FULL_BLEED_CLASS = "col-span-2 lg:col-start-1 lg:col-span-2";

/** Shell-level sidebar variants with no `@upmind/ui` implementation (tasks.md Task 3b, ui-gaps.md). `internal` maps onto the CONTENT primitive's `PortalRow` aside split instead; `floating` has no equivalent anywhere in the library. */
const UNIMPLEMENTED_SIDEBAR_VARIANTS = new Set(["floating", "internal"]);

const sidebarMeta = computed(() => {
  const primitive = props.shell.primitives.sidebar;
  if (primitive === undefined) {
    return { renders: false, startsCollapsed: false, isNested: false } as const;
  }

  if (primitive.variant === "hidden") {
    return { renders: false, startsCollapsed: false, isNested: false } as const;
  }

  if (
    primitive.variant !== undefined &&
    UNIMPLEMENTED_SIDEBAR_VARIANTS.has(primitive.variant)
  ) {
    return {
      renders: false,
      startsCollapsed: false,
      isNested: false,
      rejectedVariant: primitive.variant
    } as const;
  }

  const triggerInSidebar = primitive.trigger === "sidebar";
  // Below `lg` the topbar's trigger always renders — the drawer's opener
  // cannot live inside the closed drawer (types.ts SIDEBAR_TRIGGER).
  let topbarTriggerClass = "";
  if (triggerInSidebar) topbarTriggerClass = "lg:hidden";

  return {
    renders: true,
    // `collapsible` is a config DECISION to start in the icon rail, not a
    // second toggle — `default` (and `nested`) start expanded, exactly like
    // today's chrome.
    startsCollapsed: primitive.variant === "collapsible",
    isNested: primitive.variant === "nested",
    triggerInSidebar,
    topbarTriggerClass,
    hasHeader:
      primitive.slots.top !== undefined ||
      triggerInSidebar ||
      slots.logo !== undefined,
    top: primitive.slots.top,
    middle: primitive.slots.middle,
    bottom: primitive.slots.bottom
  } as const;
});

// Loud, not silent (tasks.md Task 3b) — mirrors PortalSlotContent's own
// dev-only rejection log; a pure resolve() stays pure, so this lives beside
// the render instead (design.md §D5).
watchEffect(() => {
  const meta = sidebarMeta.value;
  if (import.meta.dev && "rejectedVariant" in meta) {
    console.error(
      `[portal] sidebar variant "${meta.rejectedVariant}" has no shell-level implementation — see docs/sdd/portal-composition-framework/ui-gaps.md.`
    );
  }
});

/** The bars share the page's measure AND its gutter arrangement, so the logo aligns with the page title. */
const measureClass = computed(() =>
  chromeMeasureClass(props.shell.content.measure, props.shell.content.gutter)
);

const topbarMeta = computed(() => {
  const primitive = props.shell.primitives.topbar;
  if (primitive === undefined) {
    return {
      renders: false,
      isFullBleed: false,
      tone: chromeToneMeta(undefined)
    } as const;
  }

  // `tone` is what the SUB-BARS inherit (§D4) — the floating variant never
  // leaks into it, or every sub-bar would pin itself fixed over the page too.
  const tone = chromeToneMeta(primitive.tone);
  const slots = {
    left: primitive.slots.left,
    centre: primitive.slots.centre,
    right: primitive.slots.right
  };

  if (primitive.variant === "floating") {
    return {
      renders: true,
      isFullBleed: false,
      tone,
      headerTone: "transparent" as const,
      barClass: FLOATING_TOPBAR_BAR_CLASS,
      innerClass: floatingTopbarInnerClass(
        primitive.span,
        props.shell.content.measure,
        props.shell.content.gutter
      ),
      ...slots
    } as const;
  }

  return {
    renders: true,
    isFullBleed: primitive.variant === "full",
    tone,
    headerTone: tone.tone,
    barClass: tone.class,
    innerClass: chromeMeasureClass(
      props.shell.content.measure,
      props.shell.content.gutter
    ),
    ...slots
  } as const;
});

function subBarMeta(
  primitive: ResolvedPrimitive | undefined,
  stickyOffset: Readonly<Record<string, string>>
) {
  if (primitive === undefined) return { renders: false } as const;
  // `inline` renders inside the page (PortalRail), never as a chrome bar.
  if (primitive.variant === "inline") return { renders: false } as const;
  return {
    renders: true,
    stickyOffset,
    left: primitive.slots.left,
    centre: primitive.slots.centre,
    right: primitive.slots.right
  } as const;
}

/** How many of the given bars actually render — the running total's only input. */
function barCount(...bars: readonly boolean[]): number {
  return filter(bars).length;
}

const secondaryMeta = computed(() =>
  subBarMeta(
    props.shell.primitives.secondary,
    chromeStickyOffset(topbarMeta.value.renders, 0)
  )
);

const tertiaryMeta = computed(() =>
  subBarMeta(
    props.shell.primitives.tertiary,
    chromeStickyOffset(
      topbarMeta.value.renders,
      barCount(secondaryMeta.value.renders)
    )
  )
);

/** What a sticky consumer inside the page must clear: every bar above the content. */
const mainOffset = computed(() =>
  chromeStickyOffset(
    topbarMeta.value.renders,
    barCount(secondaryMeta.value.renders, tertiaryMeta.value.renders)
  )
);

/** `ResolvedPrimitive.variant` is a plain `string` (one shape for every primitive, resolve.ts) — narrowed back to the pane's own union here, the same way `topbarMeta.isFullBleed` narrows the topbar's. */
function toActionPaneVariant(variant: string | undefined): ActionPaneVariant {
  if (variant === ACTION_PANE_VARIANT.HIDDEN) return ACTION_PANE_VARIANT.HIDDEN;
  return ACTION_PANE_VARIANT.PERSISTENT;
}

/** The shape's hero band (`content.hero`), rendered by the FRAME so the tertiary rail can follow it. */
const heroMeta = computed(() => props.shell.content.hero);

const utilityMeta = computed(() => {
  const primitive = props.shell.primitives.utility;
  if (primitive === undefined) {
    return { renders: false } as const;
  }

  // `inline` renders as the page's aside track (resolve.ts synthesizes the
  // rows) — never the shell rail, and no topbar trigger.
  if (primitive.variant === "inline") {
    return { renders: false } as const;
  }

  const variant = toActionPaneVariant(primitive.variant);
  return {
    renders: true,
    variant,
    // The trigger only renders while there is something off-canvas to open.
    hasTrigger: variant === ACTION_PANE_VARIANT.HIDDEN || !isDesktop.value,
    top: primitive.slots.top,
    topmid: primitive.slots.topmid,
    botmid: primitive.slots.botmid,
    bottom: primitive.slots.bottom
  } as const;
});

const bottomMeta = computed(() => {
  const primitive = props.shell.primitives.bottom;
  if (primitive === undefined) {
    return { renders: false, insetClass: "" } as const;
  }
  return {
    renders: true,
    // The bar is viewport-fixed, so the page clears its own track below `lg`.
    insetClass: CHROME_BOTTOM_INSET_CLASS,
    default: primitive.slots.default
  } as const;
});

/**
 * The nested rail reads its items from `sidebar.middle`'s resolved module
 * props DIRECTLY (it mounts `PortalSidebarNav`, not `PortalSlotContent`), so
 * it must run the data-ref seam itself — otherwise a config whose items are a
 * `dataRef` hands the rail the ref object and the whole side menu renders
 * empty (mock/data-refs.ts).
 */
function nestedItemsOf(slot: ResolvedSlot | undefined): readonly MenuItem[] {
  if (slot === undefined || slot.status !== "module") return [];
  const resolved = resolveDataRefProps(
    slot.props,
    activeData.value,
    routeContext.value
  );
  const items = resolved?.items;
  if (!Array.isArray(items)) return [];
  return items;
}

const nestedItems = computed(() => {
  const meta = sidebarMeta.value;
  if (!meta.renders) return nestedItemsOf(undefined);
  return nestedItemsOf(meta.middle);
});

// Controlled, not left to SidebarNav's own uncontrolled stack: ShellSidebar
// swaps this content between the desktop rail and the mobile drawer with
// `v-if`/`v-else` (ShellSidebar.vue), remounting it across the `lg`
// breakpoint. An uncontrolled path would reset to the top level on every
// crossing.
const nestedPath = ref<string[]>([]);

// The `utility` primitive's off-canvas state (tasks.md 3.2: "the consumer's,
// per its v-model:open") — bound the same way `nestedPath` binds the rail's,
// so the topbar trigger and the pane's own drawer share one state PortalFrame
// actually owns.
const actionPaneOpen = ref(false);

const mainRef = ref<InstanceType<typeof ShellMain> | null>(null);

/** After-navigation focus management: delegates to ShellMain's exposed focus(). Call from router.afterEach. */
function focusMain() {
  mainRef.value?.focus();
}

defineExpose({ focusMain });
</script>
