<template>
  <div class="flex w-full items-center justify-between gap-4">
    <div class="flex flex-1 flex-col">
      <span v-if="item?.label" :class="styles.selectGrouped.content.label">
        {{ item.label }}
      </span>
      <Badge v-if="item?.badge" v-bind="item.badge" size="sm" />
      <p
        v-if="item?.description"
        :class="styles.selectGrouped.content.description"
      >
        {{ item.description }}
      </p>
    </div>
    <div class="flex flex-col items-end">
      <span
        v-if="item?.secondaryLabel"
        :class="styles.selectGrouped.content.secondaryLabel"
      >
        {{ item.secondaryLabel }}
      </span>
      <Badge
        v-if="item?.secondaryBadge"
        v-bind="item.secondaryBadge"
        size="sm"
      />
      <p
        v-if="item?.secondaryDescription"
        :class="styles.selectGrouped.content.secondaryDescription"
      >
        {{ item.secondaryDescription }}
      </p>
      <Link
        v-if="item?.action"
        v-show="isNil(item.action?.visible) || item.action?.visible"
        v-bind="item.action"
        color="muted"
        size="sm"
        @click.stop="onAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Shared item content layout for SelectGrouped items.
 *
 * Renders the label, badge, description, and action layout used by both
 * SingleItem and Item components.
 */
// --- external
import { computed } from "vue";

// --- internal
import { useStyles } from "../../utils";
import config from "./selectGrouped.config";

// --- components
import { Badge } from "../badge";
import { Link } from "../link";

// --- types
import type { SelectGroupedItemProps } from "./types";
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  item: SelectGroupedItemProps;
}>();

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.content"],
  meta,
  config
);

function onAction(event: Event) {
  event.stopPropagation();
  props.item?.action?.handler?.(event);
}
</script>
