<template>
  <li :class="styles.product.root">
    <div :class="styles.product.content">
      <div v-if="!configMeta.hideImage" :class="styles.product.image.container">
        <Link
          v-if="navigate"
          :to="{
            ...props.configureRoute,
            params: {
              pid: props.id
            },
            query: {
              ...props.configureRoute?.query,
              [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm
            }
          }"
          :disabled="processing || disabled"
          @click="doResolve"
          :tabindex="images.length === 1 ? '0' : '-1'"
          :ring="images.length === 1 ? 'focus' : 'focus-visible'"
          :class="styles.product.image.link"
        >
          <Image
            :mode="mode"
            :image="mappedImage"
            :ratio="configMeta.imageRatio"
            :class="styles.product.image.root"
            :fallback="productMeta.ui.productImageFallback.isVisible"
          />
        </Link>
        <Image
          v-else
          :mode="mode"
          :image="mappedImage"
          :ratio="ratio || configMeta.imageRatio"
          :class="styles.product.image.root"
          :fallback="productMeta.ui.productImageFallback.isVisible"
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
      </div>

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
            :hide-image="configMeta.hideImage"
            :productMeta="productMeta"
            :hide-anchor-price="configMeta.hideAnchorPrice"
          />

          <ProductBenefits
            v-if="!configMeta.hideBenefits"
            :benefits="benefits"
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
            :hide-badge="configMeta.hideTermBadge"
            v-model="selectedTerm"
          />
        </header>

        <footer :class="styles.product.footer">
          <Button
            v-bind="action"
            :loading="processing"
            variant="solid"
            :color="color"
            size="lg"
            block
            :to="
              navigate
                ? {
                    ...props.configureRoute,
                    params: {
                      pid: props.id
                    },
                    query: {
                      ...props.configureRoute?.query,
                      [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm,
                      autoupdate: canAddDirectly ? 'true' : undefined
                    }
                  }
                : undefined
            "
            :disabled="processing || disabled"
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
import {
  IMAGES_STYLE,
  QUERY_PARAMS,
  GRID_LAYOUT
} from "@upmind-automation/headless";
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

// Compute the image prop value - wrap single imgUrl in array when carousel mode
// is explicitly set, otherwise fallback to string for single image display
const mappedImage = computed(() => {
  if (!isEmpty(images.value)) {
    return images.value;
  }

  // When carousel mode is explicitly set, wrap single imgUrl in array
  if (mode.value === IMAGES_STYLE.CAROUSEL && props.productDetails?.imgUrl) {
    return [
      {
        url: props.productDetails.imgUrl,
        alt: props.productDetails?.title
      }
    ] as ImageItem[];
  }

  // Default fallback to string for single image display (auto/single modes)
  return props.productDetails?.imgUrl;
});

const isImageEmpty = computed(
  () => isEmpty(images.value) && !props.productDetails.imgUrl
);

const benefits = computed(() =>
  !isEmpty(productMeta.data.productBenefits)
    ? productMeta.data.productBenefits
    : props.productDetails?.benefits
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
  hideTermBadge:
    productMeta.ui.productListLayout.value === GRID_LAYOUT.FOUR_COL,
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

const canAddDirectly = computed(() => {
  // Not configurable = auto-add (existing behaviour via autoupdate)
  if (!props.productDetails?.configurable) return true;

  // Configurable ONLY because of terms — and we have a selected term
  if (
    props.productDetails?.configurableTerm &&
    !props.productDetails?.configurableSubproducts &&
    !props.productDetails?.configurableProvisionFields &&
    selectedTerm.value
  ) {
    return true;
  }

  return false;
});

const action = computed(() => {
  if (props.meta?.added) {
    return { icon: "check-circle-broken", label: t("confirm.in_basket") };
  }
  if (props.productDetails?.trialSupported) {
    return {
      icon: "clock-stopwatch",
      label: t("text.try_free_for_days", {
        days: props.productDetails.trialDuration
      })
    };
  }
  return { icon: "shopping-bag-02", label: t("action.add_to_basket") };
});

function doResolve() {
  if (!props.id) return;
  processing.value = true;
  emit("resolve", props.id);
}
</script>
