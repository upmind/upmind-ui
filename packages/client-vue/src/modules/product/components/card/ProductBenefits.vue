<template>
  <ul
    v-if="configMeta.hasBenefits"
    :class="styles.product.header.benefits.root"
    data-test-key="product-benefits"
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
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Icon } from "@upmind-automation/upmind-ui";
import config from "./card.config";
import { isEmpty, isString, map } from "lodash-es";
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
