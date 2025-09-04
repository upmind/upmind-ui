<template>
  <template v-if="!props.meta?.free || props.meta?.overrides">
    <ExPrice
      :regular-price="props.price?.regularPrice ?? ''"
      :discounted="props.meta?.discounted ?? false"
      :cycle="props.cycle"
    />

    <Tooltip
      v-if="props.meta?.overrides && props.price"
      to="#vue-app"
      :label="t('product.overrides')"
      color="primary"
    >
      <span class="flex items-center justify-center hover:cursor-help">
        <Icon icon="transfer" size="nano" class="text-inherit" />
        <CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :free="props.meta.free ?? false"
          :cycle="props.cycle"
        />
      </span>
    </Tooltip>

    <Tooltip v-else to="#vue-app" :label="t('product.adds')" color="primary">
      <span class="hover:cursor-help">
        <span>+</span
        ><CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :free="props.meta.free ?? false"
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
import type { SubproductValue } from "@upmind-automation/headless";

const props = defineProps<{
  price: SubproductValue["price"];
  meta: SubproductValue["meta"];
  cycle: SubproductValue["cycle"];
}>();

const { t } = useI18n();
</script>
