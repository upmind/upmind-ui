<template>
  <li :class="styles.summary.list.item.root">
    <h5 :class="styles.summary.list.item.category">
      {{ category }}
      <template v-if="quantity && quantity > 1">
        {{ `x&nbsp;${quantity}` }}
      </template>
    </h5>

    <p :class="styles.summary.list.item.title" data-test-key="summary-value">
      {{ title ?? "&ndash;" }}
    </p>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";
import type { PricingItemProps } from "./types";

const props = defineProps<PricingItemProps>();

const meta = computed(() => ({
  hasIcon: !!props.icon
}));

const styles = useStyles("summary.list.item", meta, config);
</script>
