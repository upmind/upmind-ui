<template>
  <Layout>
    <ContentSection v-auto-animate class="flex flex-grow items-center">
      <Interstitial
        open
        modal
        skrim="light"
        :title="t('basket.notFound.text')"
        :text="t('basket.notFound.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            prependIcon: {
              icon: 'arrow-left',
              size: '2xs'
            },
            label: t('basket.notFound.actions.continue')
          }
        ]"
        :animatedIcon="{
          icon: 'basket',
          delay: 5000,
          primaryColor: 'primary',
          secondaryColor: 'accent',
          size: '4xl'
        }"
      >
        <template #title>
          <SmartTitle
            i18n-key="basket.notFound.title"
            class="mt-6"
            align="center"
          />
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
import { Interstitial, Layout } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontUrl } = useBrand();
</script>
