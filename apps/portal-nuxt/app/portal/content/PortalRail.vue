<template>
  <div
    v-if="meta.renders"
    data-slot="portal-rail"
    :class="[
      'flex min-w-0 gap-3',
      meta.divider
        ? 'border-stroke mb-12 items-end border-y pt-4'
        : 'items-center'
    ]"
  >
    <div class="flex min-w-0 shrink-0 items-center gap-3">
      <PortalSlotContent :resolved-slot="meta.left" />
    </div>
    <div class="flex min-w-0 flex-1 items-center justify-center gap-3">
      <PortalSlotContent :resolved-slot="meta.centre" />
    </div>
    <div class="flex shrink-0 items-center justify-end gap-3">
      <PortalSlotContent :resolved-slot="meta.right" />
    </div>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/content/PortalRail
 * @description The tertiary primitive's `inline` variant — the dashboard rail
 * both boards draw INSIDE the page, after the header region and before the
 * rows (Host·Grid under its title block, Strata under its hero). Pages mount
 * it between `PageHeader` and `PortalContent`; a chrome-bar tertiary (any
 * other variant) renders in `PortalFrame` instead, and this renders nothing.
 * Same three regions as every bar: left shrinks, centre takes the slack,
 * right shrinks and right-aligns.
 */
import { computed } from "vue";
import PortalSlotContent from "../shell/PortalSlotContent.vue";
import type { ResolvedPrimitive } from "../resolve";

defineOptions({ name: "PortalRail" });

const props = defineProps<{
  /** The shape's resolved tertiary primitive; absent or non-`inline` renders nothing. */
  tertiary?: ResolvedPrimitive;
}>();

const meta = computed(() => {
  const tertiary = props.tertiary;
  if (tertiary === undefined || tertiary.variant !== "inline") {
    return { renders: false } as const;
  }
  return {
    renders: true,
    divider: tertiary.divider === true,
    left: tertiary.slots["left"],
    centre: tertiary.slots["centre"],
    right: tertiary.slots["right"]
  } as const;
});
</script>
