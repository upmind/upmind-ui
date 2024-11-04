<template>
  <template v-if="price">
    <span v-if="price?.price" class="flex items-center gap-1">
      <Tooltip v-if="priceOverride" :label="t('product.overrides')">
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

      {{
        price?.price_discounted
          ? price?.price_discounted_formatted
          : price?.price_formatted
      }}
    </span>

    <span v-else>{{ t("product.free") }}</span>

    <span
      v-if="price?.price_discounted"
      class="text-2xs text-base-500 leading-none line-through"
    >
      {{ price?.price_formatted }}
    </span>
  </template>

  <span v-else><!-- no applicable price --></span>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind/upwind";

const props = defineProps<{
  price?: {
    price: number;
    price_formatted: string;
    price_discounted: number;
    price_discounted_formatted: string;
  };
  priceOverride?: boolean;
}>();

const { t } = useI18n();
</script>
