<template>
  <template v-if="!props.meta?.free">
    <ExPrice v-bind="props.price" />

    <Tooltip
      v-if="props.meta?.overrides && props.price"
      :label="t('product.overrides')"
    >
      <span class="hover:cursor-help">
        <Icon icon="transfer" size="3xs" class="text-inherit" />
        {{ props.price.currentPrice }}
      </span>
    </Tooltip>

    <Tooltip v-else :label="t('product.adds')">
      <span class="hover:cursor-help">
        <span>+</span><CurrentPrice v-bind="props.price" />
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
}>();

const { t } = useI18n();
</script>
