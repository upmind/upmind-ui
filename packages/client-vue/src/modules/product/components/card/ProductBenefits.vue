<template>
  <ul
    v-if="configMeta.hasBenefits"
    :class="styles.product.header.benefits.root"
    data-testid="product-benefits"
  >
    <li
      v-for="(benefit, index) in normalizedBenefits"
      :key="benefit.label"
      :class="styles.product.header.benefits.item"
    >
      <Icon
        :icon="benefit.icon?.icon || benefit.icon || 'check-circle'"
        size="nano"
        :class="styles.product.header.benefits.icon"
      />
      {{ benefit.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import { Icon } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, isString, map } from "lodash-es";

// --- config
import config from "./card.config";

// --- types
import type { ProductBenefits } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductBenefits>();

const normalizedBenefits = computed(() =>
  map(props.benefits, benefit =>
    isString(benefit) ? { label: benefit } : benefit
  )
);

const configMeta = computed(() => ({
  hasBenefits: !isEmpty(props.benefits)
}));

const styles = useStyles(["product.header.benefits"], configMeta, config);
</script>
