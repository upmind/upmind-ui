<template>
  <div :class="landingRootVariants()">
    <Interstitial
      open
      :modal="false"
      :close-label="t('action.close')"
      :animated-icon="{ icon: 'error', size: 'xl' }"
      :title="t('error.operation_not_found')"
      :data-attrs="{ 'data-test-key': 'payment-no-invoice' }"
    />
  </div>
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { landingRootVariants } from "./variants";

const { t } = useI18n();
</script>
