<template>
  <li
    :class="cardRootVariants({ variant: configMeta.variant })"
    v-bind="
      useTestAttrs({
        key: 'product-card',
        value: props.id,
        dataAttrs: props.dataAttrs
      })
    "
  >
    <div :class="cardContentVariants({ variant: configMeta.variant })">
      <div
        v-if="!configMeta.hideImage"
        :class="
          cardImageContainerVariants({
            variant: configMeta.variant,
            isImageEmpty: configMeta.isImageEmpty
          })
        "
      >
        <Link
          v-if="navigate && !isUnavailable"
          :to="navigateRoute"
          :disabled="loading || disabled"
          @click="doResolve"
          :tabindex="images.length === 1 ? '0' : '-1'"
          :class="cardImageLinkVariants()"
        >
          <Image
            :expand-label="t('text.expand_image')"
            :nav-label="t('text.image_navigation')"
            :preview-close-label="t('action.close')"
            :mode="mode"
            :image="mappedImage"
            :ratio="configMeta.imageRatio"
            :class="
              cardImageRootVariants({
                variant: configMeta.variant,
                isLoading: configMeta.isLoading
              })
            "
            :fallback="productMeta.ui.productImageFallback.isVisible"
          />
        </Link>
        <Image
          :expand-label="t('text.expand_image')"
          :nav-label="t('text.image_navigation')"
          :preview-close-label="t('action.close')"
          v-else
          :mode="mode"
          :image="mappedImage"
          :ratio="ratio || configMeta.imageRatio"
          :class="
            cardImageRootVariants({
              variant: configMeta.variant,
              isLoading: configMeta.isLoading
            })
          "
          :fallback="productMeta.ui.productImageFallback.isVisible"
        />

        <Badge
          v-if="unavailableReason"
          :class="cardImageBadgeVariants()"
          appearance="muted"
          variant="neutral"
        >
          <Icon
            v-if="unavailableReason.icon"
            :icon="unavailableReason.icon"
            size="xs"
          />
          {{ unavailableReason.label }}
        </Badge>
        <Badge
          v-else-if="!isUnavailable && productBadge"
          :class="cardImageBadgeVariants()"
          appearance="outline"
          variant="neutral"
        >
          <Icon v-if="productBadge.icon" :icon="productBadge.icon" size="xs" />
          {{ productBadge.label }}
        </Badge>
      </div>

      <section
        :class="
          cardDetailsVariants({
            variant: configMeta.variant,
            hideTerms: configMeta.hideTerms
          })
        "
      >
        <header :class="cardHeaderRootVariants()">
          <ProductInfo
            v-bind="props"
            :selected-term="selectedTerm"
            @resolve="doResolve"
            :processing="loading"
            :title="productMeta.data.productName || props.productDetails.title"
            :navigate="navigate && !isUnavailable"
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
            v-model="selectedTerm"
          />
        </header>

        <footer :class="cardFooterVariants()">
          <Tooltip :active="inBasket && !justAdded">
            <Button
              :loading="loading || clicked"
              :variant="color ?? 'primary'"
              size="lg"
              block
              :disabled="loading || disabled || justAdded || isUnavailable"
              :data-attrs="{ 'data-test-key': 'product-card-cta' }"
              :aria-pressed="inBasket || justAdded"
              :data-test-value="inBasket || justAdded ? 'added' : 'add'"
              :as-child="!!action.to"
              @click="doResolve"
            >
              <RouterLink v-if="action.to" :to="action.to">
                <Icon v-if="action.icon" :icon="action.icon" />
                {{ action.label }}
              </RouterLink>
              <template v-else>
                <Icon v-if="action.icon" :icon="action.icon" />
                {{ action.label }}
              </template>
            </Button>
            <template #content>{{ t("confirm.in_basket_msg") }}</template>
          </Tooltip>
        </footer>
      </section>
    </div>
  </li>
</template>

<script setup lang="ts">
import { Badge } from "@upmind/ui";
import { useTestAttrs } from "@upmind/ui";
import { Image } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Tooltip } from "@upmind/ui";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { useConfig } from "@upmind-automation/headless";
import {
  IMAGES_STYLE,
  QUERY_PARAMS,
  useImageUrl
} from "@upmind-automation/headless";
import { Icon } from "../../../../components/icon";
import ProductBenefits from "./ProductBenefits.vue";
import ProductInfo from "./ProductInfo.vue";
import ProductPrice from "./ProductPrice.vue";
import ProductTerm from "./ProductTerm.vue";
import {
  cardRootVariants,
  cardContentVariants,
  cardImageContainerVariants,
  cardImageLinkVariants,
  cardImageRootVariants,
  cardImageBadgeVariants,
  cardDetailsVariants,
  cardHeaderRootVariants,
  cardFooterVariants
} from "./variants";
import { delay, isEmpty, merge, toString, isString } from "lodash-es";
import type { ProductCardProps } from "./types";
import type { ImageItem, ImageMode } from "@upmind/ui";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductCardProps>(), {
  buttonColor: "primary",
  buttonVariant: "solid",
  navigate: true,
  hideTerms: undefined,
  resetTimeout: 3000
});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

// -----------------------------------------------------------------------------

const productMeta = useConfig().with({
  product: () => props
});

const productBadge = computed(() =>
  isString(productMeta.data.productBadge)
    ? { label: productMeta.data.productBadge }
    : productMeta.data.productBadge
);

const { t } = useI18n();

const selectedTerm = ref<string | undefined>(
  toString(props.configuration.term)
);

// Local click intent — set immediately when the user clicks the action button
// to bridge the click → route-transition gap so the spinner shows instantly,
// instead of waiting for the funnel guard to flip `pendingMeta.isProcessing`.
// Cleared when the parent's `loading` flag takes over, or when `inBasket`
// confirms the add succeeded (see reset watch below).
const clicked = ref(false);

watch(
  () => props.loading,
  loading => {
    if (loading) clicked.value = false;
  }
);

// `inBasket` flipping true is the canonical "add confirmed" signal. On that
// rising edge we reset transient local state (clear click intent) and kick
// off the "Added!" flash for `resetTimeout` before settling into the steady
// "In basket" affordance.
const justAdded = ref(false);

watch(
  () => props.inBasket,
  (next, prev) => {
    if (next && !prev) {
      clicked.value = false;
      justAdded.value = true;
      delay(() => (justAdded.value = false), props.resetTimeout);
    }
  }
);

// Auto-add when no configuration is needed. For term-only products auto-add
// only when the consumer says we're in-situ (streamlined). When funnelling,
// route to configure so the term step is part of the flow.
const canAddDirectly = computed(() => {
  if (!props.productDetails?.configurable) return true;

  if (
    props.productDetails?.configurableTerm &&
    !props.productDetails?.configurableSubproducts &&
    !props.productDetails?.configurableProvisionFields &&
    selectedTerm.value &&
    (props.inSitu ?? true)
  ) {
    return true;
  }

  return false;
});

const productRoute = computed(() =>
  merge({}, props.configureRoute, {
    params: { pid: props.id },
    query: { [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm.value }
  })
);

// Navigating only — an explicit false stops the brand's auto-update setting
// adding the product behind a title/image click.
const navigateRoute = computed(() =>
  merge({}, productRoute.value, { query: { autoupdate: "false" } })
);

const actionRoute = computed(() => {
  if (!canAddDirectly.value) return productRoute.value;
  return merge({}, productRoute.value, { query: { autoupdate: "true" } });
});

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title,
    previewUrl: useImageUrl(image.url, "original")
  })) as ImageItem[];
});

const mode = computed<ImageMode>(() => {
  if (productMeta.ui.productImagesStyle.isGrid) return IMAGES_STYLE.CAROUSEL;
  return productMeta.ui.productImagesStyle.value;
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
        alt: props.productDetails?.title,
        previewUrl: useImageUrl(props.productDetails.imgUrl, "original")
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
  isLoading: props.loading,
  isImageEmpty: isImageEmpty.value
}));

const isUnavailable = computed(() => !!productMeta.data.productUnavailable);

const unavailableReason = computed(() => {
  if (!isUnavailable.value) return undefined;
  const reason = productMeta.data.productUnavailableReason;
  if (!reason) return { label: t("text.unavailable") };
  return isString(reason) ? { label: reason } : reason;
});

const actionContent = computed(() => {
  const reason = unavailableReason.value;
  if (reason && configMeta.value.hideImage) {
    return { label: reason.label, icon: reason.icon };
  }
  if (justAdded.value) {
    return { icon: "check-circle-broken", label: t("action.added_to_basket") };
  }
  if (props.inBasket) {
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

const action = computed(() => {
  const result: {
    label: string;
    icon?: string;
    to?: typeof actionRoute.value;
  } = { ...actionContent.value };
  if (props.navigate && !isUnavailable.value) result.to = actionRoute.value;
  return result;
});

function doResolve() {
  if (!props.id) return;
  if (isUnavailable.value) return;
  clicked.value = true;
  emit("resolve", props.id);
}
</script>
