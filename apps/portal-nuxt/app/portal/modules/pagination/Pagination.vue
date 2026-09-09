<template>
  <div
    v-if="meta.isVisible"
    :class="PAGER_ROW_CLASS"
    v-bind="useTestAttrs({ key: 'portal-pager' })"
  >
    <Select
      v-if="meta.hasPageSize"
      :items="meta.pageSizeItems"
      :model-value="props.state?.pageSizeValue"
      :aria-label="props.state?.pageSizeLabel"
      size="sm"
      :class="PAGE_SIZE_SELECT_CLASS"
      :data-attrs="{ 'data-test-key': 'portal-pagination-page-size' }"
      @update:model-value="onPageSize"
    />
    <Pagination
      v-if="meta.hasPages"
      :total="meta.total"
      :items-per-page="meta.itemsPerPage"
      :page="meta.page"
      :aria-label="props.label"
      class="ms-auto"
      v-bind="useTestAttrs({ key: 'portal-pagination' })"
      @update:page="onPage"
    >
      <template #info="{ page, pages }">
        <span class="text-muted text-sm">{{
          props.info ?? `${page} / ${pages}`
        }}</span>
      </template>
    </Pagination>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/pagination/Pagination
 * @description The `pagination` module — a row footer's pager and its page
 * size, over `@upmind/ui`'s composed `Pagination` and `Select`. Renders; it
 * does not decide, the same contract every other module here follows. Fed a
 * live `state` it is CONTROLLED: the facade owns the page and the size, both
 * leave through the one `select` seam, and the arrows self-hide at a single
 * page. With flat props only it stays the decorative form (uncontrolled,
 * silent).
 *
 * The size select outlives the arrows on purpose: a list of 24 rows shown 50
 * at a time fits one page, and hiding the control there would strand a
 * client with no way back to ten.
 */
import { Pagination, Select, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { PAGER_ROW_CLASS, PAGE_SIZE_SELECT_CLASS } from "./variants";
import { map, min } from "lodash-es";
import type { PaginationModuleEmits, PaginationModuleProps } from "./types";

defineOptions({ name: "PortalPagination" });

const props = defineProps<PaginationModuleProps>();

const emit = defineEmits<PaginationModuleEmits>();

const meta = computed(() => {
  const total = props.state?.total ?? props.total ?? 0;
  const itemsPerPage = props.state?.itemsPerPage ?? props.itemsPerPage ?? 1;
  const pages = Math.max(Math.ceil(total / Math.max(itemsPerPage, 1)), 1);
  const sizeOptions = props.state?.pageSizeOptions ?? [];
  const smallestSize =
    min(map(sizeOptions, option => Number(option.value))) ?? itemsPerPage;
  const hasPages = pages > 1;
  // A list that already fits the SMALLEST page offers nothing to resize.
  const hasPageSize =
    props.state?.pageSizeAction !== undefined &&
    sizeOptions.length > 0 &&
    total > smallestSize;
  return {
    total,
    itemsPerPage,
    // Undefined keeps the decorative form UNCONTROLLED — reka pages itself.
    page: props.state?.page,
    hasPages,
    hasPageSize,
    isVisible: hasPages || hasPageSize,
    // A fresh mutable copy: `Select`'s `items` is not readonly.
    pageSizeItems: map(sizeOptions, option => ({
      value: option.value,
      label: option.label
    }))
  };
});

/** Controlled mode never moves itself: the emit reaches the facade, whose new page flows back down as `state.page`. */
function onPage(next: number): void {
  const current = meta.value.page;
  if (current === undefined) return;
  if (next > current && props.state?.nextValue !== undefined) {
    emit("select", props.state.nextValue);
  }
  if (next < current && props.state?.prevValue !== undefined) {
    emit("select", props.state.prevValue);
  }
}

function onPageSize(value: unknown): void {
  const action = props.state?.pageSizeAction;
  if (action === undefined) return;
  emit("select", `${action}:${String(value)}`);
}
</script>
