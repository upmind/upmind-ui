<template>
  <span :class="styles.domain.card.prices.root">
    <s
      v-if="summary?.meta.discounted"
      :class="styles.domain.card.prices.regular"
    >
      {{ summary?.regularPrice }}
    </s>

    <strong :class="styles.domain.card.prices.current">
      {{ summary?.currentPrice
      }}<span :class="styles.domain.card.prices.cycle"> /yr</span>
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
import type { DomainPricesProps } from "../types";
import type { ComputedRef } from "vue";

const props = defineProps<DomainPricesProps>();

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
