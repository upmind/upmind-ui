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
      v-if="error"
      :id="id"
      size="sm"
      :edit-route="props.editRoute"
    />

    <div
      v-if="inlineEditor"
      class="border-base flex flex-col gap-3 border-t pt-3"
      data-testid="basket-product-inline-controls"
    >
      <BasketProductTermSelector
        v-if="inlineEditor.showTermSelector && inlineEditor.config"
        :terms="inlineEditor.config.terms?.value ?? []"
        :model-value="inlineEditor.config.model?.value?.term"
        :disabled="error"
        :processing="inlineEditor.config.meta?.value?.isProcessing"
        @update:modelValue="doUpdateTerm"
      />

      <BasketProductOptionSwitch
        v-if="inlineEditor.showOptionUpsells && inlineEditor.config"
        :options="inlineEditor.config.options?.value ?? []"
        :model-value="inlineEditor.config.model?.value?.options"
        :disabled="error"
        :processing="inlineEditor.config.meta?.value?.isProcessing"
        @update:modelValue="doToggleOption"
      />
    </div>

    <footer :class="styles.product.summary.footer.root">
      <TermsDescription v-bind="summary" :separate="!isMobile" />

      <div :class="styles.product.summary.footer.price.root">
        <QuantityField
          v-bind="productDetails"
          :id="id"
          :quantity="quantity"
          :disabled="error"
          @update:quantity="doUpdateQuantity"
        />

        <div :class="styles.product.summary.footer.price.container">
          <ExPrice
            v-if="!summary.meta?.freeTrial"
            :regular-price="summary.price.regularPrice"
            :monthly-from-regular-price="
              summary.price.monthlyFromRegularPrice ?? ''
            "
            :discounted="summary.meta.discounted ?? false"
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
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import {
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
import config from "./basketProduct.config";
import { useConfig } from "@upmind-automation/headless";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";
import { isEmpty, includes } from "lodash-es";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { UseBasketProduct } from "@upmind-automation/headless";
import type {
  SubproductDetails,
  SubproductValue
} from "@upmind-automation/headless";
import { computed } from "vue";

const { t } = useI18n();

type InlineEditorState = {
  showOptionUpsells: boolean;
  showTermSelector: boolean;
  showQuantity: boolean;
  hasInlineControls: boolean;
  config?: UseBasketProduct;
};

const props = defineProps<
  BasketProductSummaryProps & {
    inlineEditor?: InlineEditorState;
  }
>();

const emits = defineEmits(["update:quantity", "remove", "update:open"]);

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
  config
);

const open = useVModel(props, "open", emits);

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

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}

function doRemove() {
  emits("remove");
}

async function doUpdateTerm(value: number) {
  if (!props.inlineEditor?.config) return;
  await props.inlineEditor.config.updateTerm(value);
  await props.inlineEditor.config.update();
}

async function doToggleOption(payload: {
  option: SubproductDetails;
  value: SubproductValue;
  enabled: boolean;
}) {
  if (!props.inlineEditor?.config) return;
  const { option, value, enabled } = payload;
  if (enabled) {
    await props.inlineEditor.config.setOptions(option, [value.id]);
  } else {
    await props.inlineEditor.config.setOptions(option, []);
  }
  await props.inlineEditor.config.update();
}
</script>
