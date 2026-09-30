<template>
  <div :class="landingRootVariants()">
    <Interstitial
      open
      :modal="false"
      :close-label="t('action.close')"
      :animated-icon="{ icon: 'keys', size: 'xl' }"
      :title="t('auth.signed_in_title')"
      :text="t('auth.signed_in_desc')"
      :data-attrs="{ 'data-test-key': 'auth-landing' }"
    />
  </div>
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { landingRootVariants } from "./variants";

const { t } = useI18n();
</script>
