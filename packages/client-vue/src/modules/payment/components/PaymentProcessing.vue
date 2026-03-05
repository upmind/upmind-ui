<template>
  <Interstitial
    open
    modal
    size="2xl"
    :animatedIcon="{
      icon: 'tapping-card',
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      size: '4xl'
    }"
    :title="t('cart.payment_processing_md')"
    :text="t('cart.payment_processing_msg')"
  />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
