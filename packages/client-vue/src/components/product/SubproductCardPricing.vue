<template>
  <template v-if="!props.meta.free">
    <ExPrice v-bind="props" />

    <Tooltip v-if="props.meta.overrides" :label="t('product.overrides')">
      <span class="hover:cursor-help">
        <Icon icon="transfer" size="3xs" class="text-inherit" />
        {{ props.currentPrice }}
      </span>
    </Tooltip>

    <Tooltip v-else :label="t('product.adds')">
      <span class="hover:cursor-help">
        <span>+</span><CurrentPrice v-bind="props" />
      </span>
    </Tooltip>
  </template>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind-automation/upmind-ui";
import ExPrice from "../pricing/ExPrice.vue";
import CurrentPrice from "../pricing/CurrentPrice.vue";

interface PricingProps {
  regularAmount: number;
  regularPrice: string;
  currentAmount: number;
  currentPrice: string;
  meta: {
    discounted?: boolean;
    free?: boolean;
    overrides: boolean;
  };
}

const props = defineProps<PricingProps>();

const { t } = useI18n();
</script>
