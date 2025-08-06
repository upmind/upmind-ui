<template>
  <div :class="styles.products.item.root">
    <div :class="styles.products.item.content">
      <div class="relative">
        <Link
          :to="{
            name: ROUTE.PRODUCT_ADD,
            params: {
              pid: props.id
            },
            query: {
              force: 'true', // ensure we always add the product, even if it exists in the basket
              navigateOnly: 'true' // this is used to prevent the product from being added to the basket when clicking on the image
            }
          }"
          :handler="handleClick"
          :loading="processing"
          :disabled="processing"
          tabindex="-1"
          class="w-full"
        >
          <img
            v-if="productDetails?.imgUrl && !imageError"
            :src="productDetails?.imgUrl"
            :alt="productDetails?.title"
            :class="styles.products.item.image"
            @error="imageError = true"
          />

          <div v-else :class="styles.products.item.imagePlaceholder">
            <Icon
              icon="camera"
              size="xl"
              :class="styles.products.item.placeholderIcon"
            />
          </div>
        </Link>

        <div class="absolute -right-3 top-3/4">
          <Promotion
            v-for="promotion in promotions"
            v-bind="promotion"
            :key="promotion.code"
            size="md"
          />
        </div>
      </div>

      <div :class="styles.products.item.details">
        <h3 :class="styles.products.item.title">
          {{ productDetails?.title }}
        </h3>

        <ProductPriceDescription
          :name="productDetails?.name || 'term'"
          :title="productDetails?.title"
          :cycle="productDetails?.cycle"
          :price="price"
          :meta="meta"
          :show-taxes="false"
          :class="styles.products.item.termsDescription"
        />

        <p :class="styles.products.item.description">
          {{ productDetails?.description }}
        </p>

        <div :class="styles.products.item.buttonContainer">
          <Button
            :as="RouterLink"
            :to="{
              name: ROUTE.PRODUCT_ADD,
              params: {
                pid: props.id
              },
              query: {
                force: 'true' // ensure we always add the product, even if it exists in the basket
              }
            }"
            color="primary"
            block
            tabindex="-1"
            @click="handleClick"
            :loading="processing"
            :disabled="processing"
          >
            <template #prepend>
              <Icon
                icon="basket-add"
                size="2xs"
                :class="styles.products.item.buttonIcon"
              />
            </template>
            {{ t("product.basket.add") }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

// --- types
import { ROUTE, type Product } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// --- components
import { Button, Icon, useStyles, Link } from "@upmind-automation/upmind-ui";
import Promotion from "../../../basket/product/components/Promotion.vue";

// --- config
import config from "../../catalogue.config";
import ProductPriceDescription from "./ProductPriceDescription.vue";

// -----------------------------------------------------------------------------

const props = defineProps<Product>();

const { t } = useI18n();
const processing = ref(false);

// -----------------------------------------------------------------------------

let imageError = ref(false);

function handleClick(event: Event) {
  processing.value = true;
}

const styles = useStyles(
  ["products", "products.item"],
  {},
  config
) as ComputedRef<{
  products: {
    item: {
      root: string;
      content: string;
      image: string;
      imagePlaceholder: string;
      placeholderIcon: string;
      details: string;
      title: string;
      termsDescription: string;
      description: string;
      buttonContainer: string;
      buttonIcon: string;
    };
  };
}>;
</script>
