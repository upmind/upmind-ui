<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        open
        to="#vue-app"
        modal
        skrim="light"
        :title="t('cart.product_not_found_md')"
        :text="t('error.product_not_found')"
        :actions="[
          {
            ...storefrontRoute,
            color: 'primary',
            icon: 'arrow-left',
            label: t('action.continue_shopping')
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
import ContentSection from "../../components/content/ContentSection.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontRoute } = useBrand();
</script>
