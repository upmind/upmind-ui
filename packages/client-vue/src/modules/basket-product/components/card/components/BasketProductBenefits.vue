<template>
  <ul
    v-if="!isEmpty(benefits)"
    :class="styles.product.option.benefits.list"
    data-test-key="product-benefits"
  >
    <li
      v-for="benefit in normalizedBenefits"
      :key="benefit.label"
      :class="styles.product.option.benefits.item"
    >
      <div :class="styles.product.option.benefits.header">
        <Icon
          :icon="benefit.icon || 'check-circle-broken'"
          size="nano"
          :class="styles.product.option.benefits.icon"
        />
      </div>
      {{ benefit.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon, useStyles } from "@upmind-automation/upmind-ui";
import config from "../basketProduct.config";
import { isEmpty, isString, map } from "lodash-es";
import type { Benefit } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{
  benefits?: Benefit[];
}>();

const normalizedBenefits = computed(() =>
  map(props.benefits, benefit =>
    isString(benefit) ? { label: benefit } : benefit
  )
);

const styles = useStyles(["product.option.benefits"], props, config);
</script>
