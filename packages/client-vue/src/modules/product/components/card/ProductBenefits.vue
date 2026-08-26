<template>
  <ul
    v-if="configMeta.hasBenefits"
    :class="cardHeaderBenefitsRootVariants()"
    v-bind="benefitsTestAttrs"
  >
    <li
      v-for="(benefit, index) in normalizedBenefits"
      :key="benefit.label"
      :class="cardHeaderBenefitsItemVariants()"
    >
      <Icon
        :icon="benefit.icon?.icon || benefit.icon || 'check-circle'"
        size="xs"
        :class="cardHeaderBenefitsIconVariants()"
      />
      {{ benefit.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "../../../../components/icon";
import {
  cardHeaderBenefitsRootVariants,
  cardHeaderBenefitsItemVariants,
  cardHeaderBenefitsIconVariants
} from "./variants";
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
const benefitsTestAttrs = useTestAttrs({ key: "product-benefits" });
</script>
