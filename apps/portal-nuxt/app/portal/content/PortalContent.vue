<template>
  <PageBody :aside="meta.aside" :aside-size="props.asideSize">
    <div
      class="flex min-w-0 flex-col gap-6"
      v-bind="useTestAttrs({ key: 'portal-rows' })"
    >
      <template
        v-for="(row, rowIndex) in visibleRows(props.rows)"
        :key="rowIndex"
      >
        <PortalSection
          :surface="row.surface"
          :header="row.header"
          :footer="row.footer"
          :anchor="row.anchor"
        >
          <template v-if="row.slots.length" #default>
            <PortalRow :layout="row.layout" :measure="row.measure">
              <template
                v-for="(slotName, slotIndex) in ROW_SLOT_NAMES[row.layout]"
                :key="slotName"
                #[slotName]
              >
                <PortalSlotContent :resolved-slot="row.slots[slotIndex]" />
              </template>
            </PortalRow>
          </template>
        </PortalSection>
      </template>

      <slot />
    </div>

    <PageAside
      v-if="meta.hasAside"
      :ariaLabel="props.asideLabel"
      sticky
      :class="[meta.asideOrderClass, meta.asideDividerClass]"
    >
      <template
        v-for="(row, rowIndex) in visibleRows(props.aside)"
        :key="rowIndex"
      >
        <PortalSection
          :surface="row.surface"
          :header="row.header"
          :footer="row.footer"
          :anchor="row.anchor"
        >
          <template v-if="row.slots.length" #default>
            <PortalRow :layout="row.layout" :measure="row.measure">
              <template
                v-for="(slotName, slotIndex) in ROW_SLOT_NAMES[row.layout]"
                :key="slotName"
                #[slotName]
              >
                <PortalSlotContent :resolved-slot="row.slots[slotIndex]" />
              </template>
            </PortalRow>
          </template>
        </PortalSection>
      </template>
    </PageAside>
  </PageBody>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/content/PortalContent
 * @description Renders `ContentConfig.rows`, resolved (design.md §D7,
 * tasks.md Task 5's AC5.1): one `PortalRow` per configured row, in order,
 * each of its named slots filled by `PortalSlotContent`'s own module
 * resolution — the same rendering seam a chrome primitive's slot uses, so a
 * row's module obeys the SAME empty/rejected/group rules design.md §D5
 * already specifies. This is what makes a page an ordered row list FROM
 * CONFIG rather than from its template.
 */
import { PageAside, PageBody, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { resolveDataRef } from "../mock/data-refs";
import { injectActiveMockData, injectRouteContext } from "../mock/injection";
import PortalSlotContent from "../shell/PortalSlotContent.vue";
import { UTILITY_SIDE } from "../types";
import PortalRow from "./PortalRow.vue";
import PortalSection from "./PortalSection.vue";
import { ROW_SLOT_NAMES } from "./types";
import { filter } from "lodash-es";
import type { PortalContentProps } from "./types";
import type { ResolvedContentRow } from "../resolve";

defineOptions({ name: "PortalContent" });

const props = defineProps<PortalContentProps>();

// A row may name a data ref deciding whether it belongs on the page at all
// (content/types.ts `visible`). Resolved HERE rather than in the resolver,
// which is pure and knows no dataset — the same seam `PortalSlotContent` uses
// for module props.
const activeData = injectActiveMockData();
const routeContext = injectRouteContext();

function visibleRows(
  rows: readonly ResolvedContentRow[] | undefined
): readonly ResolvedContentRow[] {
  return filter(rows ?? [], row => {
    if (row.visible === undefined) return true;
    return (
      resolveDataRef(row.visible, activeData.value, routeContext.value) === true
    );
  });
}

const meta = computed(() => {
  // The gated rows are counted out too: an aside whose every row is gated off
  // would otherwise keep its track and narrow the page around nothing.
  const hasAside = visibleRows(props.aside).length > 0;
  const isLeft = props.asideSide === UTILITY_SIDE.LEFT;
  return {
    hasAside,
    // `PageBody` owns the track; "none" collapses it, so a shape with no
    // aside lays out exactly as it did before this existed.
    aside: pageBodyAside(hasAside, isLeft),
    // The library's grid puts the aside column first for `left`, and its own
    // doc says DOM order must follow visual order — the rows track is written
    // first here, so a left aside is ordered ahead of it at `lg`+.
    asideOrderClass: isLeft ? "lg:order-first" : undefined,
    asideDividerClass: dividerClass(props.asideDivider, isLeft)
  };
});

function pageBodyAside(hasAside: boolean, isLeft: boolean) {
  if (!hasAside) return "none" as const;
  return isLeft ? ("left" as const) : ("right" as const);
}

function dividerClass(divider: boolean | undefined, isLeft: boolean) {
  if (divider !== true) return undefined;
  return isLeft
    ? "border-stroke lg:border-r lg:pr-6"
    : "border-stroke lg:border-l lg:pl-6";
}
</script>
