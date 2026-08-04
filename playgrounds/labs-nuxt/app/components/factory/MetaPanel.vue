<template>
  <section v-if="items.length" :class="styles.metaPanel.root">
    <h2 :class="styles.metaPanel.title">Meta</h2>
    <div :class="styles.metaPanel.list">
      <Badge
        v-for="item in items"
        :key="item.key"
        size="sm"
        :variant="item.variant"
        :color="item.color"
      >
        {{ formatKey(item.key) }}
      </Badge>
    </div>
  </section>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/MetaPanel
 * @description Generalises the Inspector's Meta section (`inspector/Inspector.vue`)
 * over a plain `snapshot.meta` — every scoped composable's meta flags, shown as
 * colour-coded badges (design.md FE-2977 §Block C). Purely presentational —
 * no business logic, no runtime heuristics beyond the existing Inspector
 * flag-name colouring convention it generalises.
 */

import { computed } from "vue";
import { Badge, useStyles } from "@upmind-automation/upmind-ui";
import config from "./MetaPanel.styles";
import { entries, map, sortBy, startCase } from "lodash-es";
import type {
  MetaBadgeColor,
  MetaPanelItem,
  MetaPanelProps
} from "./MetaPanel.types";
// -----------------------------------------------------------------------------

const props = defineProps<MetaPanelProps>();

function badgeColor(key: string, value: boolean): MetaBadgeColor {
  const lowerKey = key.toLowerCase();
  const isErrorFlag =
    lowerKey.includes("error") || lowerKey.includes("invalid");
  const isSuccessFlag =
    lowerKey.includes("authenticated") ||
    lowerKey.includes("valid") ||
    lowerKey.includes("success");

  if (value) {
    if (isErrorFlag) return "danger";
    if (isSuccessFlag) return "success";
    return "info";
  }
  if (isSuccessFlag) return "danger";
  return "neutral";
}

function colorPriority(color: MetaBadgeColor): number {
  switch (color) {
    case "danger":
      return 0;
    case "success":
      return 1;
    case "info":
      return 2;
    default:
      return 3;
  }
}

function formatKey(key: string): string {
  return startCase(key);
}

const items = computed<MetaPanelItem[]>(() => {
  const built = map(entries(props.meta), ([key, value]) => {
    const color = badgeColor(key, value);
    return {
      key,
      value,
      color,
      variant: (color === "neutral" ? "minimal" : "solid") as
        | "minimal"
        | "solid"
    };
  });
  return sortBy(built, [item => colorPriority(item.color), "key"]);
});

const meta = computed(() => ({ count: items.value.length }));
const styles = useStyles(["metaPanel"], meta, config);
</script>
