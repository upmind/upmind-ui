<template>
  <article>
    <UpmContentSection>
      <Interstitial
        :title="t('cart.requiresAction.title')"
        :text="t('cart.requiresAction.text')"
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
            label: t('cart.requiresAction.actions.back'),
          },
          {
            color: 'primary',
            handler: next,
            appendIcon: { icon: 'arrow-right', size: '2xs' },
            label: t('cart.requiresAction.actions.continue'),
          },
        ]"
        modal
      >
        <template #title>
          <i18n-t
            keypath="cart.requiresAction.title.text"
            tag="span"
            class="font-medium text-primary"
            :plural="products.length"
          >
            <template v-slot:mask>
              <span class="font-bold">{{
                t("cart.requiresAction.title.mask")
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
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// --- utils
import {
  useProductsRequiringAction,
  useRoutingEngine,
} from "@upmind-automation/client-vue";

// --- types
// -----------------------------------------------------------------------------
const { t } = useI18n();

const { next, back } = useRoutingEngine();
const { products } = useProductsRequiringAction();

// ---
</script>
