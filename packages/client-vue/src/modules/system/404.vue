<template>
  <Layout>
    <ContentSection v-auto-animate class="flex flex-grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('basket.empty.title')"
        :text="t('basket.empty.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            prependIcon: {
              icon: 'arrow-left',
              size: '2xs'
            },
            label: t('errors.404.action')
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

        <template #title>
          <SmartTitle i18n-key="errors.404.title" class="mt-6" align="center" />
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
import { Interstitial, IconAnimated } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Layout from "../../components/layout/Layout.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontUrl } = useBrand();

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
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
