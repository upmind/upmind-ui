<template>
  <Interstitial
    open
    :title="t('basket.requiresAction.title')"
    :text="t('basket.requiresAction.text')"
    :animatedIcon="{
      icon: 'basket',
      delay: 5000,
      primaryColor: 'primary',
      secondaryColor: 'tertiary',
      size: '4xl',
    }"
    :actions="[
      {
        color: 'primary',
        variant: 'ghost',
        handler: back,
        prependIcon: { icon: 'arrow-left', size: '2xs' },
        label: t('basket.requiresAction.actions.back'),
      },
      {
        color: 'primary',
        handler: next,
        appendIcon: { icon: 'arrow-right', size: '2xs' },
        label: t('basket.requiresAction.actions.continue'),
      },
    ]"
    modal
  >
    <template #title>
      <i18n-t
        keypath="basket.requiresAction.title.text"
        tag="span"
        class="text-primary font-bold"
        :plural="productsInvalid.length"
      >
        <template v-slot:mask>
          <mask class="bg-promotion leading-relaxed">{{
            t("basket.requiresAction.title.mask")
          }}</mask>
        </template>
      </i18n-t>
    </template>

    <template #default>
      <ol class="mt-4 list-disc text-left font-semibold">
        <li v-for="basketItem in productsInvalid" :key="basketItem.id">
          <span>{{ basketItem?.product?.name }}</span>
          <span v-if="basketItem?.product?.serviceIdentifier">
            ({{ basketItem?.product?.serviceIdentifier }})
          </span>
        </li>
      </ol>
    </template>
  </Interstitial>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine, useBasket } from "@upmind-automation/headless-vue";

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const { t } = useI18n();

const { next, back } = useRoutingEngine();
const { productsInvalid } = useBasket();

// ---
</script>
