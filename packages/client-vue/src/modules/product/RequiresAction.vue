<template>
  <article>
    <ContentSection>
      <Interstitial
        :title="t('basket.requiresAction.title')"
        :text="t('basket.requiresAction.text')"
        :animatedIcon="{
          icon: Basket,
          delay: 5000,
          primaryColor: 'primary',
          secondaryColor: 'promotion',
          size: '4xl',
        }"
        :actions="[
          {
            color: 'primary',
            variant: 'ghost',
            handler: back,
            prependIcon: { icon: 'arrow-left', size: '2xs' },
            label: t('basket.requiresAction.actions.back'),
          },
          {
            color: 'primary',
            handler: next,
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
              <span>{{ basketItem?.product?.name }}</span>
              <span v-if="basketItem?.product?.serviceIdentifier">
                ({{ basketItem?.product?.serviceIdentifier }})
              </span>
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
import Basket from "../../assets/animations/basket.json?url";

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- utils
import {
  useProductsRequiringAction,
  useRoutingEngine,
} from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { next, back } = useRoutingEngine();
const { products } = useProductsRequiringAction();

// ---
</script>
