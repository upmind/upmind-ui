<template>
  <template v-if="!props.meta?.free || props.meta?.overrides">
    <ExPrice
      :regular-price="props.price?.regularPrice ?? ''"
      :monthly-from-regular-price="props.price?.monthlyFromRegularPrice ?? ''"
      :discounted="props.meta?.discounted ?? false"
    />

    <Tooltip
      v-if="props.meta?.overrides && props.price"
      :label="t('text.overrides_price')"
    >
      <span class="flex items-center justify-center hover:cursor-help">
        <Icon icon="switch-horizontal-01" size="nano" class="text-inherit" />
        <CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta.free ?? false"
          :ui-config="{
            pricing: { current: ['text-md-tight'] }
          }"
        />
      </span>
    </Tooltip>

    <Tooltip v-else :label="t('text.adds_to_price')">
      <span class="hover:cursor-help">
        <span>+</span
        ><CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta.free ?? false"
          :ui-config="{
            pricing: { current: ['text-md-tight'] }
          }"
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
