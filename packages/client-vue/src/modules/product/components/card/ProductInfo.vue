<template>
  <section :class="styles.product.header.info.root">
    <div :class="styles.product.header.info.container">
      <Badge
        v-if="productDetails?.badge"
        v-bind="productDetails?.badge"
        size="sm"
        color="promotion"
      />

      <Badge
        v-else-if="meta?.discounted || preservePromotion"
        :label="t('text.on_sale')"
        icon="tag"
        size="sm"
        color="promotion"
        :class="styles.product.header.info.promotion"
      />

      <div>
        <router-link
          v-if="navigate"
          :to="{
            name: ROUTE.PRODUCT_ADD,
            params: {
              pid: props.id
            },
            query: {
              bcm: selectedTerm,
              force: 'true', // ensure we always add the product, even if it exists in the basket
              navigateOnly: 'true' // this is used to prevent the product from being added to the basket when clicking on the title
            }
          }"
          tabindex="-1"
          class="inline-block underline underline-offset-4"
        >
          <h3 :class="styles.product.header.info.title">
            {{ productDetails?.title }}
          </h3>
        </router-link>

        <h3 v-else :class="styles.product.header.info.title">
          {{ productDetails?.title }}
        </h3>

        <DisplayPrice
          v-if="props.productDetails?.displayPrice"
          v-bind="props.productDetails.displayPrice"
          :class="styles.product.header.info.terms"
        />
      </div>
    </div>

    <ProductDescription
      v-if="!hideDescription"
      :description="productDetails?.description"
      :class="styles.product.header.info.description"
    />
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { ROUTE } from "@upmind-automation/headless";

// --- components
import { useStyles, Badge, Button } from "@upmind-automation/upmind-ui";
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductDescription from "./ProductDescription.vue";

// --- config
import config from "./product.config";

// --- types
import type { ComputedRef } from "vue";
import type { ProductInfo } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductInfo>();

const { t } = useI18n();

const metaConfig = computed(() => ({
  preservePromotion: props.preservePromotion && !props.meta?.discounted
}));

const styles = useStyles(
  ["product.header", "product.header.info"],
  metaConfig,
  config
) as ComputedRef<{
  product: {
    header: {
      info: {
        root: string;
        container: string;
        title: string;
        terms: string;
        description: string;
        promotion: string;
      };
    };
  };
}>;
</script>
