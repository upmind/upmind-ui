<template>
  <article>
    <ContentSection>
      <Interstitial
        :title="t('basket.requiresAction.title')"
        :text="t('basket.requiresAction.text')"
        :animatedIcon="{
          icon: 'basket',
          delay: 5000,
          primaryColor: 'primary',
          secondaryColor: 'promotion',
          size: '4xl',
        }"
        :actions="[
          {
            color: 'primary',
            variant: 'ghost',
            handler: navigateBack,
            prependIcon: { icon: 'arrow-left', size: '2xs' },
            label: t('basket.requiresAction.actions.back'),
          },
          {
            color: 'secondary',
            handler: navigateNext,
            appendIcon: { icon: 'arrow-right', size: '2xs' },
            label: t('basket.requiresAction.actions.continue'),
          },
        ]"
        modal
      >
        <template #title>
          <SmartTitle
            i18n-key="basket.requiresAction.title"
            :plural="products.length"
            align="center"
          />
        </template>

        <template #default>
          <ol class="mt-4 list-disc text-left font-semibold">
            <li v-for="basketItem in products" :key="basketItem.id">
              <span>{{ basketItem?.productDetails?.title }}</span>
            </li>
          </ol>
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductsRequiringAction,
  useRoutingEngine,
  ROUTE,
} from "@upmind-automation/headless";

// --- components
import Basket from "../../assets/animations/basket.json?url";
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- utils

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { navigateNext, navigateBack, isResolved } = useRoutingEngine();
const { products, isReady } = useProductsRequiringAction();

await isResolved(ROUTE.PRODUCT_REQUIRES_ACTION);

await isReady();
</script>
