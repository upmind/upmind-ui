<template>
  <template v-if="!props.meta?.free || props.meta?.overrides">
    <ExPrice
      :regular-price="props.price?.regularPrice ?? ''"
      :monthly-from-regular-price="props.price?.monthlyFromRegularPrice ?? ''"
      :discounted="props.meta?.discounted ?? false"
      :overridden="props.meta?.overridden"
      :ui-config="{
        pricing: { ex: [styles.card.pricing.ex] }
      }"
    />

    <Tooltip
      v-if="props.meta?.overrides && props.price"
      :label="t('text.overrides_price')"
    >
      <span :class="styles.card.pricing.current">
        <Icon icon="switch-horizontal-01" size="nano" class="text-inherit" />
        <CurrentPrice
          :class="props.class"
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta?.free ?? false"
          :ui-config="{
            pricing: { current: [styles.card.pricing.current] }
          }"
        />
        <span
          v-if="
            props.meta?.oneoff &&
            props.term &&
            props.term > 0 &&
            !props.meta.free
          "
          class="ml-1"
          >{{ lowerCase(t("term.one_time")) }}</span
        >
      </span>
    </Tooltip>

    <Tooltip v-else :label="t('text.adds_to_price')">
      <span :class="styles.card.pricing.current">
        <span>+</span>
        <CurrentPrice
          :class="props.class"
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta?.free ?? false"
          :ui-config="{
            pricing: { current: [styles.card.pricing.current] }
          }"
        />
        <span
          v-if="
            props.meta?.oneoff &&
            props.term &&
            props.term > 0 &&
            !props.meta.free
          "
          class="ml-1"
          >{{ lowerCase(t("term.one_time")) }}</span
        >
      </span>
    </Tooltip>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Tooltip, useStyles } from "@upmind-automation/upmind-ui";
import ExPrice from "../pricing/ExPrice.vue";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import config from "./subproduct-card.config";
import { lowerCase } from "lodash-es";
import type { SubproductValue } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{
  price: SubproductValue["price"];
  meta?: SubproductValue["meta"];
  cycle: SubproductValue["cycle"];
  term?: number;
  class?: string;
  dropdown?: boolean;
}>();

const { t } = useI18n();

const pricingMeta = computed(() => ({
  isDropdown: !!props.dropdown
}));

const styles = useStyles(["card.pricing"], pricingMeta, config);
</script>
