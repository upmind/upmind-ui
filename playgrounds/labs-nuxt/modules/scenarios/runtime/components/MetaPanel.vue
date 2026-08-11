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
        {{ startCase(item.key) }}
      </Badge>
    </div>
  </section>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/MetaPanel
 * @description Generalises the Inspector's Meta section (`inspector/Inspector.vue`)
 * over a plain `snapshot.meta` — every scoped composable's meta flags, shown as
 * colour-coded badges. Purely presentational — no business logic, no runtime
 * heuristics beyond the existing Inspector flag-name colouring convention it
 * generalises.
 */

import { computed } from "vue";
import { Badge, useStyles } from "@upmind-automation/upmind-ui";
import config from "./MetaPanel.styles";
import { MetaBadgeColor, MetaBadgeVariant } from "./MetaPanel.types";
import { entries, includes, map, sortBy, startCase } from "lodash-es";
import type { MetaPanelItem, MetaPanelProps } from "./MetaPanel.types";
// -----------------------------------------------------------------------------

const props = defineProps<MetaPanelProps>();

function badgeColor(key: string, value: boolean): MetaBadgeColor {
  const lowerKey = key.toLowerCase();
  const isErrorFlag =
    includes(lowerKey, "error") || includes(lowerKey, "invalid");
  const isSuccessFlag =
    includes(lowerKey, "authenticated") ||
    (includes(lowerKey, "valid") && !includes(lowerKey, "invalid")) ||
    includes(lowerKey, "success");

  if (value) {
    if (isErrorFlag) return MetaBadgeColor.DANGER;
    if (isSuccessFlag) return MetaBadgeColor.SUCCESS;
    return MetaBadgeColor.INFO;
  }
  if (isSuccessFlag) return MetaBadgeColor.DANGER;
  return MetaBadgeColor.NEUTRAL;
}

function colorPriority(color: MetaBadgeColor): number {
  switch (color) {
    case MetaBadgeColor.DANGER:
      return 0;
    case MetaBadgeColor.SUCCESS:
      return 1;
    case MetaBadgeColor.INFO:
      return 2;
    default:
      return 3;
  }
}

const items = computed<MetaPanelItem[]>(() => {
  const built = map(entries(props.meta), ([key, value]) => {
    const color = badgeColor(key, value);
    return {
      key,
      value,
      color,
      variant:
        color === MetaBadgeColor.NEUTRAL
          ? MetaBadgeVariant.MINIMAL
          : MetaBadgeVariant.SOLID
    };
  });
  return sortBy(built, [item => colorPriority(item.color), "key"]);
});

const meta = computed(() => ({ count: items.value.length }));
const styles = useStyles(["metaPanel"], meta, config);
</script>
