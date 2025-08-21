<template>
  <li :class="styles.summary.list.item.root">
    <h5 :class="styles.summary.list.item.category">
      {{ category }}
      <template v-if="quantity && quantity > 1">
        {{ `x&nbsp;${quantity}` }}
      </template>
    </h5>

    <p
      :class="styles.summary.list.item.title"
      :data-testid="`summary-value-${kebabCase(category)}`"
    >
      {{ title ?? "&ndash;" }}
    </p>
  </li>
</template>

<script setup lang="ts">
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";
import { computed } from "vue";

// --- internal
import config from "./summary.config";

// --- types
import type { SummaryItemProps } from "./types";
import type { ComputedRef } from "vue";
import { kebabCase } from "lodash-es";

const props = defineProps<SummaryItemProps>();

const meta = computed(() => ({
  hasIcon: !!props.icon
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
        content: string;
      };
    };
  };
}>;
</script>
