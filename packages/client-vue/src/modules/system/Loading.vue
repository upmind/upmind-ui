<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('text.loading_title_md')"
      :text="t('text.almost_there_msg')"
    >
      <template #background>
        <slot name="loading-background"></slot>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { LAYOUT_VARIANTS } from "../../components/layout";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { LAYOUT_VARIANTS } from "../../components/layout";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: false,
  animatedIcon: () => ({
    icon: "loading",
    delay: 250,
    primaryColor: "base-foreground",
    secondaryColor: "secondary",
    size: "4xl"
  })
});
</script>
