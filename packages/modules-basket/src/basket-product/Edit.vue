<template>
  <LayoutProvider>
    <slot :template="configMeta.ui.template.value" />

    <template
      v-if="!isSlotHidden('product-details')"
      #product-details="{
        direction = PRODUCT_HERO_DIRECTION.HORIZONTAL,
        heroImage = true
      }"
    >
      <slot
        name="product-details"
        :config-meta="configMeta"
        :product="product"
        :product-image="productImage"
      >
        <ProductHero
          v-if="productMeta?.isAvailable && product?.productDetails"
          :product-details="product.productDetails"
          :product-image="productImage()"
          :direction="direction"
          :image="heroImage && configMeta.ui.productImages.isVisible"
          :meta="configMeta"
        >
          <template #prepend>
            <Breadcrumb
              :more-label="t('text.more')"
              v-if="productMeta?.isAvailable && breadcrumbItems.length"
              :items="breadcrumbItems"
              separator="/"
            >
              <template #item="{ crumb }">
                <BreadcrumbPage
                  v-if="(!crumb.to && !crumb.href) || crumb.current"
                  class="text-faint inline-flex items-center gap-1 text-base font-normal"
                  ><Icon :icon="crumb.icon" /> {{ crumb.label }}</BreadcrumbPage
                >
                <Link
                  v-else
                  :to="crumb.to"
                  :href="crumb.href"
                  :size="crumb.icon ? 'sm' : 'md'"
                  color="muted"
                  ><Icon :icon="crumb.icon" /> {{ crumb.label }}</Link
                >
              </template>
            </Breadcrumb>
          </template>
        </ProductHero>
        <ProductHeroSkeleton v-else />
      </slot>
    </template>

    <template #image>
      <ProductImage
        v-if="
          product?.productDetails &&
          (!isEmpty(product.productDetails?.images) ||
            product.productDetails.imgUrl)
        "
        :product-details="product.productDetails"
        :images="product.productDetails?.images"
      />
    </template>

    <template #configuration>
      <slot
        name="configuration"
        :product="product"
        :basket-product="basketProduct"
        :product-meta="productMeta"
        :config-meta="configMeta"
        :do-resolve="doResolve"
        :do-reject="doReject"
      >
        <Section
          :label="t('text.product_configuration')"
          value="product-configuration"
          icon="settings-04"
          :actions="configurationActions"
        >
          <form @submit.prevent @reset.prevent>
            <Config
              v-if="basketProduct && productMeta?.isAvailable"
              :meta="configMeta"
              :touched="productMeta?.showErrors"
              :item="basketProduct"
              :model-value="basketProduct?.id"
              :hide-terms="props.hideTerms"
              :no-footer="true"
              as="fieldset"
              @resolve="doResolve"
              @reject="doReject"
            />

            <UpmProductNotFound
              v-else-if="productMeta?.isUnavailable"
              :storefront-route="props.storefrontRoute"
            />

            <ConfigSkeleton v-else />
          </form>
        </Section>
      </slot>
    </template>

    <template #pricing="{ showTotal = false, showActions = false }">
      <Section :label="t('text.configuration_summary')" icon="shopping-bag-02">
        <slot
          name="pricing"
          :product="product"
          :model="model"
          :terms="terms"
          :product-meta="productMeta"
          :config-meta="configMeta"
          :do-resolve="doResolve"
          :update-quantity="updateQuantity"
          :update-term="updateTerm"
        >
          <Pricing
            v-if="product && productMeta?.isAvailable"
            :product="product"
            :meta="productMeta"
            :total="showTotal"
            :title="configMeta.data.productName || product.productDetails.title"
            :options="configMeta.ui.productConfigOptionsSummary.isVisible"
            :fields="configMeta.ui.productConfigFieldsSummary.isVisible"
          />

          <PricingSkeleton v-else />

          <slot
            v-if="showActions"
            name="actions"
            :product="product"
            :config-meta="configMeta"
            :product-meta="productMeta"
            :do-resolve="doResolve"
            :update-quantity="updateQuantity"
          >
            <BasketActions
              v-if="product && productMeta?.isAvailable"
              :product="product"
              :meta="productMeta"
              @resolve="doResolve"
              @update:quantity="updateQuantity"
            />
          </slot>
        </slot>
      </Section>
    </template>

    <template
      v-if="
        configMeta.ui.trustMessaging.isVisible &&
        configMeta.data.trustMessagingMarkdown
      "
      #markdown
    >
      <slot
        name="markdown"
        :product="product"
        :config-meta="configMeta"
        :product-meta="productMeta"
      >
        <Markdown
          v-if="product?.productDetails"
          v-bind="summaryAppendTestAttrs"
          :model-value="configMeta.data.trustMessagingMarkdown"
        />
      </slot>
    </template>

    <template #actions>
      <slot
        name="actions"
        :product="product"
        :config-meta="configMeta"
        :do-resolve="doResolve"
        :update-quantity="updateQuantity"
      >
        <BasketActions
          v-if="product && productMeta?.isAvailable"
          :product="product"
          :meta="productMeta"
          @resolve="doResolve"
          @update:quantity="updateQuantity"
        />
      </slot>
    </template>

    <template #errors>
      <Alert
        class="w-full"
        v-if="productMeta?.isLocked"
        variant="neutral"
        appearance="outline"
        :title="t('error.basket_product_readonly')"
      >
        <template #icon><Icon icon="lock-01" /></template>
      </Alert>
      <Alert
        class="w-full"
        v-if="externalErrors?.message"
        variant="danger"
        :title="externalErrors?.message"
      >
        <template #icon><Icon icon="alert-triangle" /></template>
      </Alert>
      <ConfigErrors
        :visible="productMeta?.showErrors"
        :errors="validationErrors"
      />
    </template>

    <template #total>
      <PricingTotal
        v-if="product && productMeta?.isAvailable"
        :pricing="product.pricing"
        footer
      />
    </template>

    <template #terms>
      <slot name="terms" />
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Link, Markdown } from "@upmind/ui";
import { Breadcrumb } from "@upmind/ui";
import { BreadcrumbPage } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { useClipboard } from "@vueuse/core";
import { computed, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Section } from "@upmind-automation/foundation";
import { Icon } from "@upmind-automation/foundation";
import { useBreadcrumbs } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  useProductConfig,
  type ProductDetails,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { BreadcrumbVariant, UIContext } from "@upmind-automation/headless";
import { Config } from "@upmind-automation/product";
import { ConfigErrors } from "@upmind-automation/product";
import { ConfigSkeleton } from "@upmind-automation/product";
import { ProductHero } from "@upmind-automation/product";
import { ProductHeroSkeleton } from "@upmind-automation/product";
import { ProductImage } from "@upmind-automation/product";
import { PRODUCT_HERO_DIRECTION } from "@upmind-automation/product";
import { Pricing } from "@upmind-automation/product";
import { PricingSkeleton } from "@upmind-automation/product";
import { PricingTotal } from "@upmind-automation/product";
import { UpmProductNotFound } from "@upmind-automation/product";
import BasketActions from "./components/BasketActions.vue";
import { includes, take, isEmpty } from "lodash-es";
import type { BasketProductEditProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductEditProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();

const { navigateBack, navigateNext } = useRoutingEngine();
const { configure } = useBasketProducts();
const { basketProductId } = useQueryParams();
const { copy, copied, isSupported } = useClipboard({ legacy: true });

const summaryAppendTestAttrs = useTestAttrs({ key: "slots:summary-append" });

const {
  stop: _stop,
  update,
  service: basketProduct,
  onDone,
  isReady
} = await configure(basketProductId, { allowMultipleEdits: true });

const productConfig = useProductConfig(basketProduct);

if (!productConfig)
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );
provide("useProductConfig", productConfig);

const {
  meta: productMeta,
  model,
  product,
  externalErrors,
  validationErrors,
  productImage,
  updateQuantity,
  updateTerm,
  terms,
  shareUrl
} = productConfig;

const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

await isReady();

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const stylesMeta = computed(() => {
  return {
    breadcrumbs: configMeta.ui.breadcrumbs.value as BreadcrumbVariant
  };
});

const { items: breadcrumbItems } = useBreadcrumbs({
  categories: () => {
    const breadcrumb = product.value?.productDetails?.breadcrumb ?? [];
    return stylesMeta.value?.breadcrumbs === BreadcrumbVariant.PARENT
      ? take(breadcrumb, 1)
      : breadcrumb;
  },
  route: () => props.catalogueRoute,
  storefrontRoute: () => props.storefrontRoute,
  variant: () => stylesMeta.value?.breadcrumbs,
  currentItem: () =>
    product.value?.productDetails &&
    stylesMeta.value?.breadcrumbs !== BreadcrumbVariant.PARENT
      ? { label: product.value.productDetails.title }
      : undefined
});

async function doResolve() {
  update()
    .then(() => navigateNext(basketProduct))
    .catch(error => {
      console.warn("Product Configuration Error", error);
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      onDone().then(() => {
        navigateNext(basketProduct);
      });
    });
}

function doReject() {
  navigateBack();
}

const configurationActions = computed(() => {
  if (!isSupported.value) return [];
  return [
    {
      icon: copied.value ? "check" : "share-07",
      label: copied.value ? t("confirm.copied") : t("action.share"),
      handler: handleShare
    }
  ];
});

const handleShare = () => {
  copy(shareUrl.value || window.location.href);
};

// Emit productDetails when it loads/changes for parent components (e.g., SEO, schema)
const emit = defineEmits<{
  productDetails: [payload: ProductDetails];
}>();

watch(
  () => product.value?.productDetails,
  value => {
    if (value) {
      emit("productDetails", value);
    }
  },
  { immediate: true }
);

defineExpose({ product: () => product.value?.productDetails });
</script>
