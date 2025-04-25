<template>
  <div :class="styles.product.configDetails.container">
    <DetailsGroup
      v-for="(group, index) in groupedDetails"
      :key="'details-group-' + index"
      :id="id"
      :category="first(group)?.category"
      :items="group"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { groupBy, first } from "lodash-es";
import { computed } from "vue";

// --- components
import DetailsGroup from "./components/DetailsGroup.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- types
import type { BasketProductConfigDetailsProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<BasketProductConfigDetailsProps>();

const styles = useStyles(
  ["product.configDetails"],
  props,
  config
) as ComputedRef<{
  product: {
    configDetails: {
      container: string;
    };
  };
}>;

const groupedDetails = computed(
  (): Record<string, BasketProductConfigDetailsProps["details"]> => {
    return groupBy(props.details, "category");
  }
);
</script>
