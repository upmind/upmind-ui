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

          <Tooltip :label="t('action.remove')" color="neutral">
            <Link :aria-label="t('action.remove')" @click="doRemove">
              <Icon
                icon="trash-01"
                size="xs"
                :class="styles.product.summary.icon"
              />
            </Link>
          </Tooltip>
        </div>

        <hgroup :class="styles.product.summary.title.root">
          <Link
            v-bind="props.editRoute"
            offset="2"
            :class="styles.product.summary.title.link"
          >
            <h3 :class="styles.product.summary.title.text">
              {{ data.productName || summary.title }}
            </h3>
          </Link>

          <template v-if="!isMobile">
            <Tooltip
              v-if="!isEmpty(filteredDetails)"
              :label="t('action.show_details')"
            >
              <Link @click="open = !open" aria-label="Product information">
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
                :disabled="error"
              />

              <Tooltip
                v-if="summary.meta?.overridden"
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
      :title="
        t('text.free_trial_alert', { days: productDetails.trialDuration })
      "
      icon="clock-stopwatch"
      size="sm"
      color="promo"
    />

    <RequiredAlert
      v-if="error || !isEmpty(props.configErrors)"
      :id="id"
      size="sm"
      :edit-route="props.editRoute"
    />

    <div
      v-if="props.inlineMeta?.hasInlineControls"
      class="flex flex-col gap-3"
      data-testid="basket-product-inline-controls"
    >
      <BasketProductTermSelector
        v-if="props.inlineMeta.showTermSelector && props.terms"
        :terms="props.terms"
        v-model="term"
        :disabled="error || !isEmpty(props.configErrors)"
        :processing="processing"
      />

      <BasketProductOptionSwitch
        v-if="props.inlineMeta.showOptionUpsells && props.upsellOptions"
        :options="props.upsellOptions"
        v-model="options"
        :disabled="error || !isEmpty(props.configErrors)"
        :processing="processing"
      />
    </div>

    <footer :class="styles.product.summary.footer.root">
      <TermsDescription v-bind="summary" :separate="!isMobile" />

      <div :class="styles.product.summary.footer.price.root">
        <QuantityField
          v-bind="productDetails"
          :id="id"
          v-model:quantity="quantity"
          :disabled="error"
        />

        <div :class="styles.product.summary.footer.price.container">
          <ExPrice
            v-if="!summary.meta?.freeTrial"
            :regular-price="summary.price.regularPrice"
            :monthly-from-regular-price="
              summary.price.monthlyFromRegularPrice ?? ''
            "
            :discounted="summary.meta.discounted ?? false"
            :overridden="summary.meta.overridden"
            :ui-config="{ pricing: { ex: [styles.product.pricing.ex] } }"
          />

          <strong
            v-if="summary.meta?.freeTrial"
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
            :ui-config="{
              pricing: { current: [styles.product.pricing.current] }
            }"
          />
        </div>
      </div>
    </footer>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import {
  Badge,
  Link,
  Icon,
  Tooltip,
  Image,
  Alert
} from "@upmind-automation/upmind-ui";
import RequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";
import BasketProductConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import BasketProductTermSelector from "./components/BasketProductTermSelector.vue";
import BasketProductOptionSwitch from "./components/BasketProductOptionSwitch.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import styleConfig from "./basketProduct.config";
import { useConfig, type ProductModel } from "@upmind-automation/headless";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";
import { isEmpty, includes } from "lodash-es";

// --- types
import type { BasketProductSummaryProps } from "./types";
import { computed } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["remove", "update:open"]);

const styles = useStyles(
  [
    "product.summary",
    "product.summary.header",
    "product.summary.category",
    "product.summary.title",
    "product.summary.footer",
    "product.summary.footer.price",
    "product.pricing"
  ],
  props,
  styleConfig
);

const open = defineModel<boolean>("open");
const quantity = defineModel<ProductModel["quantity"]>("quantity");
const term = defineModel<ProductModel["term"]>("term");
const options = defineModel<ProductModel["options"]>("options");

const { ui, data } = useConfig().with({
  product: () => props
});

const filteredDetails = computed(() => {
  const showOptions = ui.productConfigOptionsSummary.isVisible;

  return props.details.filter((detail, index) => {
    const { name, cycle, meta } = detail;
    const isPrimary = index === 0;
    const isField = name?.includes("provision_field");
    const isTerm = name === "term";
    const isProduct = name === "product";

    // Terms: show only if cycle > 0
    if (isTerm) return cycle && cycle > 0;

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
  });
});

function doRemove() {
  emits("remove");
}
</script>
