<template>
  <ul
    v-if="configMeta.hasBenefits"
    :class="styles.product.header.benefits.root"
  >
    <li
      v-for="benefit in benefits"
      :key="benefit.label"
      :class="styles.product.header.benefits.item"
    >
      <Icon
        :icon="benefit.icon?.icon || benefit.icon"
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
import { isEmpty } from "lodash-es";

// --- config
import config from "./product.config";

// --- types
import type { ComputedRef } from "vue";
import type { ProductBenefits } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductBenefits>();

const configMeta = computed(() => ({
  hasBenefits: !isEmpty(props.benefits)
}));

const styles = useStyles(
  ["product.header.benefits"],
  configMeta,
  config
) as ComputedRef<{
  product: {
    header: {
      benefits: {
        root: string;
        item: string;
        icon: string;
      };
    };
  };
}>;
</script>
