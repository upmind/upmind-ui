<template>
  <span :class="styles.selectGrouped.header.primary">
    <strong :class="styles.selectGrouped.header.label">
      {{ props.groupName }}
    </strong>
    <template v-if="props.selectedLabel">
      <Icon
        icon="arrow-right"
        :class="styles.selectGrouped.header.arrow"
      />
      <strong :class="styles.selectGrouped.header.label">
        {{ props.selectedLabel }}
      </strong>
      <Badge
        v-for="(item, index) in badges"
        :key="index"
        v-bind="item"
        size="sm"
      />
    </template>
  </span>
</template>

<script setup lang="ts">
/**
 * Renders the primary label content for a multi-item group header.
 *
 * Displays the group name and, when an item is selected, an arrow separator
 * followed by the selected item's label and optional promotional badge.
 */
// --- external
import { computed } from "vue";
// --- components
import { Badge } from "../badge";
import { Icon } from "../icon";
import config from "./selectGrouped.config";
import { useStyles } from "../../utils";
// --- utils
import { castArray } from "lodash-es";
// --- types
import type { BadgeProps } from "../badge";
import type { CxOptions } from "class-variance-authority";
// -----------------------------------------------------------------------------

const props = defineProps<{
  groupName?: string;
  selectedLabel?: string;
  badge?: BadgeProps | BadgeProps[];
  uiConfig?: { selectGrouped: CxOptions };
}>();

const badges = computed(() =>
  props.badge ? castArray(props.badge) : []
);

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.header"],
  meta,
  config,
  props.uiConfig ?? {}
);
</script>
