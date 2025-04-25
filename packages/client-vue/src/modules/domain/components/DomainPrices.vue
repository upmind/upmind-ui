<template>
  <span :class="styles.domain.card.prices.root">
    <s v-if="props?.meta.discounted" :class="styles.domain.card.prices.regular">
      {{ props.price.regularPrice }}
    </s>

    <strong :class="styles.domain.card.prices.current">
      {{ props.price.currentPrice }}
      <span :class="styles.domain.card.prices.cycle"> /yr</span>
    </strong>
  </span>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "../domain.config";

// --- types
import type { DomainSummaryProps } from "../types";
import type { ComputedRef } from "vue";

const props = defineProps<DomainSummaryProps>();

const meta = computed(() => ({
  //
}));

const styles = useStyles(["domain.card.prices"], meta, config) as ComputedRef<{
  domain: {
    card: {
      prices: {
        root: string;
        regular: string;
        current: string;
        cycle: string;
      };
    };
  };
}>;
</script>
