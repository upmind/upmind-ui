<template>
  <template v-if="!props.meta?.free || props.meta?.overrides">
    <ExPrice
      :regular-price="props.price?.regularPrice ?? ''"
      :meta="props.meta"
      :cycle="props.cycle"
    />

    <Tooltip
      v-if="props.meta?.overrides && props.price"
      :label="t('product.overrides')"
    >
      <span class="hover:cursor-help">
        <Icon icon="transfer" size="3xs" class="text-inherit" />
        <CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :meta="props.meta"
          :cycle="props.cycle"
        />
      </span>
    </Tooltip>

    <Tooltip v-else :label="t('product.adds')">
      <span class="hover:cursor-help">
        <span>+</span
        ><CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :meta="props.meta"
          :cycle="props.cycle"
        />
      </span>
    </Tooltip>
  </template>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind-automation/upmind-ui";
import ExPrice from "../pricing/ExPrice.vue";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import type { SubproductValue } from "@upmind-automation/headless-vue";

const props = defineProps<{
  price: SubproductValue["price"];
  meta: SubproductValue["meta"];
  cycle: SubproductValue["cycle"];
}>();

const { t } = useI18n();
</script>
