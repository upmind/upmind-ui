<template>
  <li :class="styles.product.root">
    <div :class="styles.product.content">
      <Button
        :to="
          navigate
            ? {
                name: ROUTE.PRODUCT_ADD,
                params: {
                  pid: props.id
                },
                query: {
                  bcm: selectedTerm,
                  force: 'true', // ensure we always add the product, even if it exists in the basket
                  navigateOnly: 'true' // this is used to prevent the product from being added to the basket when clicking on the image
                }
              }
            : undefined
        "
        :handler="handleResolve"
        :loading="processing"
        :disabled="processing"
        tabindex="-1"
        class="w-full rounded-lg"
        variant="link"
      >
        <Image
          v-if="!configMeta.hideImage"
          :carousel="!configMeta.hideCarousel"
          :image="isEmpty(images) ? props.productDetails.imgUrl : images"
          :ratio="configMeta.imageRatio"
          :class="styles.product.image"
        />
      </Button>

      <section :class="styles.product.details">
        <header :class="styles.product.header.root">
          <ProductInfo v-bind="props" />
          <ProductBenefits
            v-if="!configMeta.hideBenefits"
            :benefits="productMeta?.card?.benefits?.data"
          />

          <section :class="styles.product.header.price.root">
            <ProductPrice v-if="!configMeta.hidePrice" v-bind="props" />
          </section>
          <ProductTerm
            v-if="!configMeta.hideTerms"
            :prices="props.pricing"
            v-model="selectedTerm"
          />
        </header>

        <footer :class="styles.product.footer">
          <Button
            :to="
              navigate
                ? {
                    name: ROUTE.PRODUCT_ADD,
                    params: {
                      pid: props.id
                    },
                    query: {
                      bcm: selectedTerm,
                      force: 'true' // ensure we always add the product, even if it exists in the basket
                    }
                  }
                : undefined
            "
            icon="basket-add"
            color="primary"
            :loading="processing"
            size="lg"
            block
            pill
            :label="t('product.basket.add')"
            @click="handleResolve"
          />
        </footer>
      </section>
    </div>
  </li>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { ROUTE } from "@upmind-automation/headless";

// --- components
import { Button, Image, useStyles } from "@upmind-automation/upmind-ui";
import config from "./product.config";
import ProductInfo from "./ProductInfo.vue";
import ProductBenefits from "./ProductBenefits.vue";
import ProductPrice from "./ProductPrice.vue";
import ProductTerm from "./ProductTerm.vue";

// --- utils
import { isEmpty, toString } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ImageItem, ImageProps } from "@upmind-automation/upmind-ui";
import type { ProductCardProps } from "./types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

const { t } = useI18n();

const props = withDefaults(defineProps<ProductCardProps>(), {
  variant: "default",
  navigate: true
});

const productMeta = computed(() => props.productDetails.uiMeta?.product);
const selectedTerm = ref<string | undefined>(
  toString(props.configuration.term)
);

const configMeta = computed(() => ({
  variant: productMeta.value?.variant ?? props.variant,
  imageRatio: productMeta.value?.image?.ratio as ImageProps["ratio"],
  hideBenefits: productMeta.value?.card?.benefits?.hide ?? props.hideBenefits,
  hideImage: productMeta.value?.image?.hide,
  hideCarousel: productMeta.value?.image?.carousel,
  hidePrice: productMeta.value?.card?.terms?.hide,
  hideDescription: productMeta.value?.card?.description?.hide,
  hideTerms: (productMeta.value?.card?.terms?.hide || props.hideTerms) ?? true
}));

const styles = useStyles(
  ["product", "product.header", "product.header.info", "product.header.price"],
  configMeta,
  config
) as ComputedRef<{
  product: {
    root: string;
    image: string;
    content: string;
    details: string;
    header: {
      root: string;
      price: {
        root: string;
      };
    };
    footer: string;
  };
}>;

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const processing = ref(false);

function handleResolve() {
  if (!props.id) return;
  processing.value = true;
  emit("resolve", props.id);
}
</script>
