<template>
  <span :class="styles.domain.card.prices.root">
    <s v-if="props?.meta.discounted" :class="styles.domain.card.prices.regular">
      {{ props.price.regularPrice }}
    </s>

    <strong :class="styles.domain.card.prices.current">
      <template v-if="props.meta.free">{{ t("text.free") }}</template>

      <template v-else
        >{{ props.price.currentPrice }}
        <span :class="styles.domain.card.prices.cycle">
          <span v-if="props?.cycle"
            >/ {{ parseBillingCycle(props.cycle).descriptive }}</span
          >
        </span>
      </template>
    </strong>
  </span>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "../domain.config";

// --- types
import type { DomainSummaryProps } from "../types";
import type { ComputedRef } from "vue";

const props = defineProps<DomainSummaryProps>();

const { t } = useI18n();

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
