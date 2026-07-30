<template>
  <article :class="styles.product.summary.article" v-auto-animate>
    <header :class="styles.product.summary.header.root">
      <Link
        v-if="props.image && productDetails.imgUrl"
        v-bind="props.editRoute"
      >
        <Image
          :image="productDetails.imgUrl"
          :alt="summary.title"
          :class="styles.product.summary.image"
          :ratio="ui.productImageRatio.value"
        />
      </Link>

      <div :class="styles.product.summary.header.content">
        <div :class="styles.product.summary.header.top">
          <div :class="styles.product.summary.category.root">
            <strong :class="styles.product.summary.category.text">
              {{ summary.category }}
            </strong>

            <Link
              v-if="isMobile && !isEmpty(filteredDetails)"
              :dataAttrs="{ 'data-test-key': 'button-product-information' }"
              @click="open = !open"
              color="muted"
              aria-label="Product information"
            >
              <Icon
                icon="info-circle"
                size="xs"
                :class="styles.product.summary.icon"
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
            :ui-config="{ pricing: { ex: [styles.product.pricing.ex] } }"
          />
        </div>

        <hgroup :class="styles.product.summary.title.root">
          <div :class="styles.product.summary.title.group">
            <Link
              v-bind="productDetails.readonly ? null : props.editRoute"
              offset="2"
              :class="styles.product.summary.title.link"
            >
              <strong
                v-bind="productNameTestAttrs(id)"
                :class="styles.product.summary.title.text"
              >
                {{ data.productName || summary.title }}
              </strong>
            </Link>

            <template v-if="!isMobile">
              <Tooltip
                v-if="!isEmpty(filteredDetails)"
                :label="t('action.show_details')"
              >
                <Link
                  :dataAttrs="{ 'data-test-key': 'button-product-information' }"
                  @click="open = !open"
                  color="muted"
                  aria-label="Product information"
                >
                  <Icon
                    icon="info-circle"
                    size="xs"
                    :class="styles.product.summary.icon"
                  />
                </Link>
              </Tooltip>

              <template v-if="!summary.meta?.freeTrial">
                <Promotion
                  v-for="(promotion, index) in summary.promotions"
                  :key="index"
                  v-bind="promotion"
                  :disabled="warning"
                />

                <Tooltip
                  v-if="summary.meta?.custom"
                  :label="t('text.price_manually_adjusted_msg')"
                >
                  <Badge
                    :label="t('text.custom_price')"
                    size="sm"
                    variant="muted"
                    color="warning"
                  />
                </Tooltip>
              </template>
            </template>
          </div>

          <strong
            v-if="summary.meta?.freeTrial"
            v-bind="trialPriceLabelTestAttrs"
            :class="styles.product.pricing.current"
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
              pricing: { current: [styles.product.pricing.current] }
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
      icon="clock-stopwatch"
      size="sm"
      color="promo"
    />

    <!-- configurable cards show the config inline, so the "add missing
         data" alert — which links out to the configure page — is redundant. -->
    <RequiredAlert
      v-if="(error || !isEmpty(props.configErrors)) && !props.configurable"
      :id="id"
      size="sm"
      :edit-route="props.editRoute"
    />

    <footer :class="styles.product.summary.footer.root">
      <div
        :class="styles.product.summary.footer.terms.root"
        v-bind="billingTermSectionTestAttrs"
      >
        <div :class="styles.product.summary.footer.terms.controls">
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
            icon="trash-02"
            variant="control"
            color="neutral"
            size="md"
            icon-only
            :class="styles.product.summary.footer.remove"
            :aria-label="t('action.remove')"
            :disabled="processing"
            @click="doRemove"
          />

          <BasketProductTermSelector
            v-if="meta.showTermSelector && props.terms"
            :terms="props.terms"
            v-model="term"
            :disabled="error || !isEmpty(props.configErrors)"
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
import {
  Badge,
  Button,
  Link,
  Icon,
  Tooltip,
  Image,
  Alert
} from "@upmind-automation/upmind-ui";
import { useStyles, useTestAttrs } from "@upmind-automation/upmind-ui";
import { isMobile } from "@upmind-automation/upmind-ui";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import styleConfig from "./basketProduct.config";
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

const styles = useStyles(
  [
    "product.summary",
    "product.summary.header",
    "product.summary.category",
    "product.summary.title",
    "product.summary.footer",
    "product.summary.footer.terms",
    "product.pricing"
  ],
  props,
  styleConfig
);

const trialPriceLabelTestAttrs = useTestAttrs({ key: "trial-price-label" });

const billingTermSectionTestAttrs = useTestAttrs({
  key: "billing-term-section"
});

const productNameTestAttrs = (value: string) =>
  useTestAttrs({ key: "basket-product-name", value });

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
