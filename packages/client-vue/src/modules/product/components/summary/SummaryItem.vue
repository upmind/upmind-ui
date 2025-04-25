<template>
  <li :class="styles.summary.list.item.root">
    <span :class="styles.summary.list.item.icon">
      <Icon v-if="meta.hasIcon && icon" :icon="icon" size="2xs" />
    </span>

    <span>
      <h5 :class="styles.summary.list.item.category">
        {{ category }}
      </h5>

      <strong :class="styles.summary.list.item.title">{{
        title ?? "&ndash;"
      }}</strong>

      <span
        :class="styles.summary.list.item.quantity"
        v-if="quantity && quantity > 1"
      >
        &nbsp;{{ `x&nbsp;${quantity}` }}
      </span>
    </span>
  </li>
</template>

<script setup lang="ts">
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";
import { computed } from "vue";

// --- internal
import config from "./summary.config";

// --- components
import { Icon } from "@upmind-automation/upmind-ui";

// --- types
import type { SummaryItemProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<SummaryItemProps>();

const meta = computed(() => ({
  hasIcon: !!props.icon,
}));

const styles = useStyles("summary.list.item", meta, config) as ComputedRef<{
  summary: {
    list: {
      item: {
        root: string;
        category: string;
        title: string;
        quantity: string;
        icon: string;
      };
    };
  };
}>;
</script>
