<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('text.loading_title_md')"
        :text="t('text.almost_there_msg')"
      >
        <template #background>
          <slot name="loading-background"></slot>
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Interstitial, LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import ContentSection from "../../components/content/ContentSection.vue";

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
