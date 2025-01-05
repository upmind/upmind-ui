<template>
  <template v-if="!props.meta.free">
    <span class="flex items-center gap-1">
      <Tooltip v-if="props.meta.overrides" :label="t('product.overrides')">
        <Icon
          icon="transfer"
          size="3xs"
          class="bg-primary text-primary-foreground rounded-full opacity-50 transition-all duration-300 hover:opacity-100"
        />
      </Tooltip>

      <Tooltip v-else :label="t('product.adds')">
        <Icon
          icon="plus"
          size="3xs"
          class="bg-primary text-primary-foreground rounded-full opacity-50 transition-all duration-300 hover:opacity-100"
        />
      </Tooltip>

      {{ props.currentPrice }}
    </span>

    <span
      v-if="props.meta.discounted"
      class="text-2xs text-emphasis-medium leading-none line-through"
    >
      {{ props.regularPrice }}
    </span>
  </template>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind-automation/upwind";

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
