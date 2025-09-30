<template>
  <Layout>
    <ContentSection>
      <Interstitial
        to="#vue-app"
        :title="t('cart.basket_products_require_attention_md')"
        :text="t('cart.basket_products_review_desc')"
        :animatedIcon="{
          icon: 'basket',
          delay: 5000,
          primaryColor: 'primary',
          secondaryColor: 'promotion',
          size: '4xl'
        }"
        :actions="[
          {
            color: 'base',
            variant: 'ghost',
            handler: navigateBack,
            icon: 'arrow-left',
            label: t('action.back_to_basket')
          },
          {
            color: 'primary',
            handler: navigateNext,
            iconAppend: 'arrow-right',
            label: t('action.review_next_product')
          }
        ]"
        modal
      >
        <template #default>
          <ol class="mt-4 list-disc text-left font-medium">
            <li v-for="basketItem in products" :key="basketItem.id">
              <span>{{ basketItem?.productDetails?.title }}</span>
            </li>
          </ol>
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductsRequiringAction,
  useRoutingEngine,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Interstitial, Layout } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";

// --- utils

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { navigateNext, navigateBack, isResolved } = useRoutingEngine();
const { products, isReady } = useProductsRequiringAction();

await isResolved(ROUTE.PRODUCT_REQUIRES_ACTION);

await isReady();
</script>
