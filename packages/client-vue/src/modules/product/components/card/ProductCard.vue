<template>
  <li :class="styles.product.root">
    <div :class="styles.product.content">
      <Link
        v-if="!configMeta.hideImage && navigate"
        :to="{
          ...props.configureRoute,
          params: {
            pid: props.id
          },
          query: {
            [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm
          }
        }"
        :disabled="processing || disabled"
        @click="doResolve"
        :tabindex="images.length === 1 ? '0' : '-1'"
        :ring="images.length === 1 ? 'focus' : 'focus-visible'"
        :class="styles.product.image.container"
      >
        <Image
          :mode="mode"
          :image="isEmpty(images) ? props.productDetails.imgUrl : images"
          :ratio="configMeta.imageRatio"
          :class="styles.product.image.root"
        />

        <Badge
          v-if="productMeta.data.productBadge"
          :class="styles.product.image.badge"
          v-bind="
            isString(productMeta.data.productBadge)
              ? { label: productMeta.data.productBadge }
              : productMeta.data.productBadge
          "
          variant="minimal"
          color="neutral"
        />
      </Link>

      <Image
        v-else-if="!configMeta.hideImage"
        :mode="mode"
        :image="isEmpty(images) ? props.productDetails.imgUrl : images"
        :ratio="ratio || configMeta.imageRatio"
        :class="styles.product.image.root"
        :fallback="productMeta.ui.productImageFallback.isVisible"
      />

      <section :class="styles.product.details">
        <header :class="styles.product.header.root">
          <ProductInfo
            v-bind="props"
            :selected-term="selectedTerm"
            @resolve="doResolve"
            :processing="processing"
            :title="productMeta.data.productName || props.productDetails.title"
            :navigate="navigate"
            :hide-description="configMeta.hideDescription"
            :productMeta="productMeta"
            :hide-anchor-price="configMeta.hideAnchorPrice"
          />

          <ProductBenefits
            v-if="!configMeta.hideBenefits"
            :benefits="productMeta.data.productBenefits"
          />

          <ProductPrice
            v-if="
              (!configMeta.hidePrice || !configMeta.hideTermSummary) &&
              props.productDetails?.displayPrice
            "
            v-bind="props.productDetails.displayPrice"
            :hide-price="configMeta.hidePrice"
            :hide-term-summary="configMeta.hideTermSummary"
          />

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
                    ...props.configureRoute,
                    params: {
                      pid: props.id
                    },
                    query: {
                      [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm,
                      autoupdate: props.productDetails?.configurable
                        ? undefined
                        : 'true' // ensure we always add the product, even if it exists in the basket
                    }
                  }
                : undefined
            "
            :disabled="processing || disabled"
            :icon="meta?.added ? 'check-circle-broken' : 'shopping-bag-02'"
            :loading="processing"
            variant="solid"
            :color="color"
            size="lg"
            block
            :label="
              meta?.added ? t('confirm.in_basket') : t('action.add_to_basket')
            "
            @click="doResolve"
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
import { IMAGES_STYLE, QUERY_PARAMS } from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";

// --- components
import {
  Button,
  Image,
  Link,
  useStyles,
  Badge
} from "@upmind-automation/upmind-ui";
import config from "./card.config";
import ProductInfo from "./ProductInfo.vue";
import ProductBenefits from "./ProductBenefits.vue";
import ProductPrice from "./ProductPrice.vue";
import ProductTerm from "./ProductTerm.vue";

// --- utils
import { isEmpty, toString, isString } from "lodash-es";

// --- types
import type { ImageItem, ImageMode } from "@upmind-automation/upmind-ui";
import type { ProductCardProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductCardProps>(), {
  buttonColor: "primary",
  buttonVariant: "solid",
  navigate: true,
  hideTerms: undefined
});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

// -----------------------------------------------------------------------------

const productMeta = useConfig().with({
  product: () => props
});

const { t } = useI18n();

const selectedTerm = ref<string | undefined>(
  toString(props.configuration.term)
);

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const mode = computed<ImageMode>(() => {
  const style = productMeta.ui.productImagesStyle.value;
  // TODO: Implement image grid
  if (style === IMAGES_STYLE.GRID) return IMAGES_STYLE.AUTO;
  return style;
});

const isImageEmpty = computed(
  () => isEmpty(images.value) && !props.productDetails.imgUrl
);

const configMeta = computed(() => ({
  variant: productMeta.ui.productStyle.value,
  imageRatio: productMeta.ui.productImageRatio.value,
  hideBenefits: productMeta.ui.productBenefits.isHidden,
  hideImage: productMeta.ui.productImages.isHidden,
  hideDescription: productMeta.ui.productDescription.isHidden,
  hidePrice: productMeta.ui.productPriceSummary.isHidden,
  hideTerms: productMeta.ui.productTermSelector.isHidden,
  hideTermSummary: productMeta.ui.termSelectorSummary.isHidden,
  hideAnchorPrice: productMeta.ui.productAnchorPrice.isHidden,
  isLoading: processing,
  isImageEmpty: isImageEmpty.value
}));

const styles = useStyles(
  [
    "product",
    "product.image",
    "product.header",
    "product.header.info",
    "product.header.price"
  ],
  configMeta,
  config
);

const processing = ref(false);

function doResolve() {
  if (!props.id) return;
  processing.value = true;
  emit("resolve", props.id);
}
</script>
