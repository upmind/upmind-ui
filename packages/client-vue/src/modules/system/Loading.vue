<template>
  <div
    class="flex items-center justify-center"
    :class="props.open ? 'grow' : ''"
  >
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

// --- internal

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";

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
