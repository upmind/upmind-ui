<template>
  <Layout>
    <ContentSection>
      <Interstitial
        open
        modal
        skrim="light"
        :title="t('basket.notFound.text')"
        :text="t('basket.notFound.text')"
        :actions="[
          {
            color: 'secondary',
            handler: navigateBack,
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
          <SmartTitle i18n-key="basket.notFound.title" align="center" />
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import Layout from "../../components/layout/Layout.vue";

// -----------------------------------------------------------------------------
const { navigateBack } = useRoutingEngine();
const { t } = useI18n();
</script>
