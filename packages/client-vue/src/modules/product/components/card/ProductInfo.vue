<template>
  <section :class="styles.product.header.info.root">
    <div :class="styles.product.header.info.container">
      <Badge
        v-if="meta?.discounted || preservePromotion"
        :label="t('product.promotion')"
        icon="tag"
        size="sm"
        color="promotion"
        :class="styles.product.header.info.promotion"
      />

      <div>
        <h3 :class="styles.product.header.info.title">
          {{ productDetails?.title }}
        </h3>

        <DisplayPrice
          :product-details="productDetails"
          :meta="meta"
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

// --- components
import { useStyles, Badge } from "@upmind-automation/upmind-ui";
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
