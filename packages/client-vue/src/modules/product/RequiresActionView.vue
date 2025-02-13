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
          <i18n-t
            keypath="basket.requiresAction.title.text"
            tag="span"
            class="text-primary font-medium"
            :plural="products.length"
          >
            <template v-slot:mask>
              <span class="font-bold">{{
                t("basket.requiresAction.title.mask")
              }}</span>
            </template>
          </i18n-t>
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

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";

// --- utils
import {
  useProductsRequiringAction,
  useRoutingEngine,
} from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { next, back } = useRoutingEngine();
const { products } = useProductsRequiringAction();

// ---
</script>
