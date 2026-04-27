<template>
  <div class="flex grow items-center justify-center" v-if="meta.hasProducts">
    <Interstitial
      :title="t('cart.basket_products_require_attention_md', products.length)"
      :text="t('cart.basket_products_review_desc')"
      :animatedIcon="{
        icon: 'basket',
        delay: 5000,
        primaryColor: 'primary',
        secondaryColor: 'promotion',
        size: '4xl'
      }"
      modal
    >
      <template #default>
        <ol class="text-sm-tight mt-4 list-disc text-left font-medium">
          <li v-for="basketItem in products" :key="basketItem.id">
            <span>{{ basketItem?.productDetails?.title }}</span>
          </li>
        </ol>
      </template>

      <template #actions>
        <span class="flex flex-col items-center gap-2">
          <Button
            size="lg"
            variant="solid"
            color="primary"
            iconAppend="arrow-right"
            :label="t('action.review_next_product')"
            :loading="isNavigating"
            @click.stop="navigateNext"
          />
          <Link :label="t('action.do_this_later')" @click.stop="navigateBack" />
        </span>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductsRequiringAction,
  useRoutingEngine
} from "@upmind-automation/headless";

// --- components
import { Interstitial, Button, Link } from "@upmind-automation/upmind-ui";

// --- utils

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { navigateNext, navigateBack, isNavigating } = useRoutingEngine();
const { products, isReady, meta } = useProductsRequiringAction();

await isReady();
</script>
