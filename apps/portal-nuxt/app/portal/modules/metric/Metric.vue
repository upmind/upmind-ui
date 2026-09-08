<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />

  <div
    v-else-if="meta.isTile"
    :class="meta.tileGridClass"
    v-bind="useTestAttrs({ key: 'portal-metric-tiles' })"
  >
    <!-- A tile that names a destination IS the link: the whole card is the
         target, as legacy's dashboard tiles were. `Stat` carries no link of
         its own (ui-gaps.md), so the wrapper is where it lives. -->
    <component
      :is="tileTag(item)"
      v-for="item in props.items"
      :key="item.label"
      :to="item.to"
      :color="tileLinkColor(item)"
      :class="TILE_CLASS"
      v-bind="useTestAttrs({ key: 'portal-metric-tile', value: item.label })"
    >
      <span class="flex flex-col gap-1">
        <span class="text-display text-sm font-medium">{{ item.label }}</span>
        <span class="type-display-bold text-display type-data text-2xl">{{
          item.value
        }}</span>
        <span v-if="item.description" class="text-2xs text-muted">{{
          item.description
        }}</span>
      </span>
    </component>
  </div>

  <StatGroup
    v-else
    :stats="[...props.items]"
    :columns="meta.statGroupColumns"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/metric/Metric
 * @description The `metric` module (tasks.md 5.5, `content`-tagged), over
 * `@upmind/ui`'s `StatGroup` — plus the `tile` variant's hand-assembled muted
 * tiles (`Stat` exposes no label part override, and its `type-label` uppercase
 * ledger style is not the tile's sentence-case one — ui-gaps.md). Items are
 * config-owned data (`ModuleRef.props`), never hardcoded here.
 */
import { EmptyState, Link, StatGroup, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { METRIC_MODULE_VARIANT } from "./types";
import { TILE_CLASS, tileGridClass } from "./variants";
import type { MetricModuleItem, MetricModuleProps } from "./types";

defineOptions({ name: "PortalMetric" });

const props = defineProps<MetricModuleProps>();

/** A tile that names a destination IS the link; one that does not is a plain block. */
function tileTag(item: MetricModuleItem): typeof Link | "div" {
  if (item.to === undefined) return "div";
  return Link;
}

/** The tile owns its own colours, so the link must not repaint them. */
function tileLinkColor(item: MetricModuleItem): "inherit" | undefined {
  if (item.to === undefined) return undefined;
  return "inherit";
}

const meta = computed(() => {
  const isTile = props.variant === METRIC_MODULE_VARIANT.TILE;
  const isSingleColumn = props.columns === 1;
  return {
    isEmpty: props.items.length === 0,
    isTile,
    tileGridClass: tileGridClass(props.columns),
    // `1` is tile-only; StatGroup's own scale starts at 2, so it keeps its default.
    statGroupColumns: isSingleColumn ? undefined : props.columns
  };
});
</script>
