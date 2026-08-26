<template>
  <ul
    v-if="!isEmpty(benefits)"
    :class="productOptionBenefitsListVariants()"
    v-bind="benefitsTestAttrs"
  >
    <li
      v-for="benefit in normalizedBenefits"
      :key="benefit.label"
      :class="productOptionBenefitsItemVariants()"
    >
      <div :class="productOptionBenefitsHeaderVariants()">
        <Icon
          :icon="benefit.icon || 'check-circle-broken'"
          size="xs"
          :class="productOptionBenefitsIconVariants()"
        />
      </div>
      {{ benefit.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "../../../../../components/icon";
import {
  productOptionBenefitsListVariants,
  productOptionBenefitsItemVariants,
  productOptionBenefitsHeaderVariants,
  productOptionBenefitsIconVariants
} from "../basketProduct.variants";
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
const benefitsTestAttrs = useTestAttrs({ key: "product-benefits" });
</script>
