<template>
  <div :class="loadingRootVariants()">
    <Interstitial
      open
      :animated-icon="SPINNER"
      :close-label="t('action.close')"
      :title="t('text.loading_title_md')"
      :text="t('text.almost_there_msg')"
    />
  </div>
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { loadingRootVariants } from "../variants";
import type { InterstitialAnimatedIcon } from "@upmind/ui";

const SPINNER: InterstitialAnimatedIcon = {
  icon: "loading",
  delay: 250,
  size: "xl"
};

const { t } = useI18n();
</script>
