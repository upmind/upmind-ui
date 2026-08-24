<template>
  <li :class="summaryListItemRootVariants()">
    <h5 :class="summaryListItemCategoryVariants()">
      {{ category }}
      <template v-if="quantity && quantity > 1">
        {{ `x&nbsp;${quantity}` }}
      </template>
    </h5>

    <p :class="summaryListItemTitleVariants()" v-bind="titleTestAttrs">
      {{ title ?? "&ndash;" }}
    </p>
  </li>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import {
  summaryListItemRootVariants,
  summaryListItemCategoryVariants,
  summaryListItemTitleVariants
} from "./variants";
import type { PricingItemProps } from "./types";

defineProps<PricingItemProps>();
const titleTestAttrs = useTestAttrs({ key: "summary-value" });
</script>
