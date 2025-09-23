<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('error.404.title_md')"
        :text="t('error.404.text')"
        :actions="[
          {
            ...storefrontRoute,
            color: 'primary',
            icon: 'arrow-left',
            label: t('error.404.action')
          }
        ]"
      >
        <template #avatar>
          <div>
            <IconAnimated
              v-for="(icon, index) in icons"
              :key="index"
              :ref="'icon' + index"
              :icon="icon.icon"
              size="3xl"
              secondary-color="accent"
              trigger="sequence"
              :sequence="icon.sequence"
            />
          </div>
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// -- components
import {
  Interstitial,
  IconAnimated,
  Layout
} from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontRoute } = useBrand();

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  to: "#vue-app",
  skrim: "light"
});

const createRepeatSequence = (
  sequence: string,
  repetitions: number = 1
): string => {
  return Array(repetitions).fill(sequence).join(",play,");
};

const icons = [
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:0,state:in-reveal,play,delay:2000,state:out-reveal,play,delay:0",
      50
    )
  },
  {
    icon: "zero",
    sequence: createRepeatSequence(
      "delay:300,state:in-reveal,play,delay:1700,state:out-reveal,play,delay:0",
      50
    )
  },
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:600,state:in-reveal,play,delay:1400,state:out-reveal,play,delay:0",
      50
    )
  }
];
</script>
