<template>
  <article :class="productSummaryArticleVariants()" v-auto-animate>
    <header :class="productSummaryHeaderRootVariants()">
      <Link v-if="props.image && productDetails.imgUrl" :to="props.editRoute">
        <Image
          :expand-label="t('text.expand_image')"
          :nav-label="t('text.image_navigation')"
          :preview-close-label="t('action.close')"
          :image="productDetails.imgUrl"
          :alt="summary.title"
          :class="productSummaryImageVariants()"
          :ratio="ui.productImageRatio.value"
        />
      </Link>

      <div :class="productSummaryHeaderContentVariants()">
        <div :class="productSummaryHeaderTopVariants()">
          <div :class="productSummaryCategoryRootVariants()">
            <strong :class="productSummaryCategoryTextVariants()">
              {{ summary.category }}
            </strong>

            <Link
              v-if="isMobile && !isEmpty(filteredDetails)"
              :data-attrs="{ 'data-test-key': 'button-product-information' }"
              @click="open = !open"
              color="muted"
              aria-label="Product information"
            >
              <Icon
                icon="info-circle"
                size="md"
                :class="productSummaryIconVariants()"
              />
            </Link>
          </div>

          <ExPrice
            v-if="!summary.meta?.freeTrial"
            :dataAttrs="{
              'data-test-key': 'regular-price',
              'data-test-value': summary.price.regularPrice
            }"
            :regular-price="summary.price.regularPrice"
            :monthly-from-regular-price="
              summary.price.monthlyFromRegularPrice ?? ''
            "
            :discounted="summary.meta.discounted ?? false"
            :custom="summary.meta.custom"
            :loading="props.pricesUpdating"
            :ui-config="{ pricing: { ex: [productPricingExVariants()] } }"
          />
        </div>

        <hgroup :class="productSummaryTitleRootVariants()">
          <div :class="productSummaryTitleGroupVariants()">
            <Link
              :to="titleRoute"
              offset="2"
              :class="productSummaryTitleLinkVariants()"
            >
              <strong
                data-test-key="basket-product-name"
                :data-test-value="id"
                :class="productSummaryTitleTextVariants()"
              >
                {{ data.productName || summary.title }}
              </strong>
            </Link>

            <template v-if="!isMobile">
              <Tooltip v-if="!isEmpty(filteredDetails)">
                <Link
                  :data-attrs="{
                    'data-test-key': 'button-product-information'
                  }"
                  @click="open = !open"
                  color="muted"
                  aria-label="Product information"
                >
                  <Icon
                    icon="info-circle"
                    size="md"
                    :class="productSummaryIconVariants()"
                  />
                </Link>
                <template #content>{{ t("action.show_details") }}</template>
              </Tooltip>

              <template v-if="!summary.meta?.freeTrial">
                <Promotion
                  v-for="(promotion, index) in summary.promotions"
                  :key="index"
                  v-bind="promotion"
                  :disabled="warning"
                />

                <Tooltip v-if="summary.meta?.custom">
                  <Badge size="sm" appearance="muted" variant="warning">
                    {{ t("text.custom_price") }}
                  </Badge>
                  <template #content>{{
                    t("text.price_manually_adjusted_msg")
                  }}</template>
                </Tooltip>
              </template>
            </template>
          </div>

          <strong
            v-if="summary.meta?.freeTrial"
            data-test-key="trial-price-label"
            :class="productPricingCurrentVariants()"
          >
            {{ t("text.free_trial") }}
          </strong>

          <CurrentPrice
            v-else
            :current-price="summary.price.currentPrice"
            :monthly-from-current-price="
              summary.price.monthlyFromCurrentPrice ?? ''
            "
            :free="summary.meta.free ?? false"
            :loading="props.pricesUpdating"
            :ui-config="{
              pricing: { current: [productPricingCurrentVariants()] }
            }"
          />
        </hgroup>
      </div>
    </header>

    <BasketProductConfigurationDetails
      v-if="open && !isEmpty(filteredDetails)"
      :id="id"
      :details="filteredDetails"
      :summary="summary"
      :edit-route="props.editRoute"
    />

    <Alert
      v-if="summary.meta?.freeTrial"
      :dataAttrs="{
        'data-test-key': 'trial-alert',
        'data-test-value': productDetails.trialDuration ?? ''
      }"
      :title="
        t('text.free_trial_alert', { days: productDetails.trialDuration })
      "
      variant="promo"
    >
      <template #icon><Icon icon="clock-stopwatch" /></template>
    </Alert>

    <!-- configurable cards show the config inline, so the "add missing
         data" alert — which links out to the configure page — is redundant. -->
    <RequiredAlert
      v-if="(error || !isEmpty(props.configErrors)) && !props.configurable"
      :id="id"
      size="sm"
      :edit-route="props.editRoute"
    />

    <footer :class="productSummaryFooterRootVariants()">
      <div
        :class="productSummaryFooterTermsRootVariants()"
        data-test-key="billing-term-section"
      >
        <div :class="productSummaryFooterTermsControlsVariants()">
          <BasketQuantityField
            v-if="productDetails.quantifiable && !productDetails.readonly"
            v-bind="productDetails"
            :id="id"
            v-model:quantity="quantity"
            :disabled="processing"
            @remove="doRemove"
          />

          <Button
            v-else-if="!productDetails.readonly"
            variant="control"
            size="md"
            icon-only
            :class="productSummaryFooterRemoveVariants()"
            :aria-label="t('action.remove')"
            :disabled="processing"
            @click="doRemove"
          >
            <Icon icon="trash-02" />
          </Button>

          <BasketProductTermSelector
            v-if="meta.showTermSelector && props.terms"
            :terms="props.terms"
            v-model="term"
            :processing="processing"
          />
        </div>

        <div>
          <RenewDescription
            :cycle="summary.cycle"
            :discounted="summary.meta?.discounted"
            :free-trial="summary.meta?.freeTrial"
            :oneoff="summary.meta?.oneoff"
            :regular-price="summary.price?.regularPrice"
            :renewal-price="summary.meta?.renewalPrice"
          />
        </div>
      </div>
    </footer>
  </article>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig, type ProductModel } from "@upmind-automation/headless";
import { Badge } from "@upmind/ui";
import { Image } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Tooltip } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../../components/icon";
import { isMobile } from "../../../../composables/isMobile";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import {
  productSummaryArticleVariants,
  productSummaryHeaderRootVariants,
  productSummaryHeaderContentVariants,
  productSummaryHeaderTopVariants,
  productSummaryCategoryRootVariants,
  productSummaryCategoryTextVariants,
  productSummaryIconVariants,
  productSummaryImageVariants,
  productSummaryTitleRootVariants,
  productSummaryTitleGroupVariants,
  productSummaryTitleLinkVariants,
  productSummaryTitleTextVariants,
  productSummaryFooterRootVariants,
  productSummaryFooterTermsRootVariants,
  productSummaryFooterTermsControlsVariants,
  productSummaryFooterRemoveVariants,
  productPricingCurrentVariants,
  productPricingExVariants
} from "./basketProduct.variants";
import BasketProductConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import BasketProductTermSelector from "./components/BasketProductTermSelector.vue";
import BasketQuantityField from "./components/BasketQuantityField.vue";
import Promotion from "./components/Promotion.vue";
import RenewDescription from "./components/RenewDescription.vue";
import RequiredAlert from "./components/RequiredAlert.vue";
import { filter, isEmpty, includes } from "lodash-es";
import type { BasketProductContentProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<BasketProductContentProps>();

const emits = defineEmits(["remove", "update:open"]);

const open = defineModel<boolean>("open");
const quantity = defineModel<ProductModel["quantity"]>("quantity");
const term = defineModel<ProductModel["term"]>("term");

const { ui, data } = useConfig().with({
  basketProduct: () => props
});

const meta = computed(() => {
  // a configurable card owns inline editing, so it offers term selection
  // whatever the brand's default (which targets the catalogue)
  const canSelectTerm =
    props.configurable || props.inlineMeta?.showTermSelector;
  const isOneoff = !!props.summary.meta?.oneoff;
  const isReadonly = !!props.productDetails.readonly;
  const hasTerms = !isEmpty(props.terms);

  return {
    showTermSelector: !!canSelectTerm && hasTerms && !isOneoff && !isReadonly
  };
});

// a readonly product's title is text, not a route into configuration
const titleRoute = computed(() => {
  if (props.productDetails.readonly) return undefined;
  return props.editRoute;
});

const filteredDetails = computed(() => {
  const showOptions = ui.productConfigOptionsSummary.isVisible;

  return filter<BasketProductContentProps["details"][number]>(
    props.details,
    (detail, index) => {
      const { name, cycle, meta } = detail;
      const isPrimary = index === 0;
      const isField = name?.includes("provision_field");
      const isTerm = name === "term";
      const isProduct = name === "product";

      // Terms: show only if cycle > 0
      if (isTerm) return (cycle ?? 0) > 0;

      // Exclude invalid items
      if (meta?.invalid) return false;

      // Exclude one-off primary items with no cycle
      if (isPrimary && !cycle) return false;

      // Filter product options
      if (!showOptions && !isProduct && !isField) return false;

      // For primary or single item lists
      if (isPrimary || props.details.length === 1) {
        return !isField;
      }

      // For other items: exclude if in pricing array
      return !includes(props.pricing, detail.id) && !isField;
    }
  );
});

function doRemove() {
  emits("remove");
}
</script>
