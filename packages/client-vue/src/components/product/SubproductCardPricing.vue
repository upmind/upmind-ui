<template>
  <span v-if="props.meta.free">{{ t("product.free") }}</span>

  <template v-else>
    <span class="flex items-center gap-1">
      <Tooltip v-if="props.meta.overrides" :label="t('product.overrides')">
        <span class="hover:cursor-help">
          <Icon icon="transfer" size="3xs" class="text-inherit" />
          {{ props.currentPrice }}
        </span>
      </Tooltip>

      <Tooltip v-else :label="t('product.adds')">
        <span class="hover:cursor-help">
          <span>+</span>{{ props.currentPrice }}
        </span>
      </Tooltip>
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
