<template>
  <article>
    <div :class="styles.product.option.root">
      <hgroup>
        <h5 :class="styles.product.summary.category.text">
          {{ summary.category }}
        </h5>
        <Link
          v-bind="props.editRoute"
          offset="2"
          :class="styles.product.summary.title.link"
        >
          <h3 :class="styles.product.summary.title.text">
            {{ summary.title }}
          </h3>
        </Link>
      </hgroup>

      <footer :class="styles.product.option.footer">
        <ExPrice
          :regular-price="summary.price.regularPrice"
          :monthly-from-regular-price="
            summary.price.monthlyFromRegularPrice ?? ''
          "
          :discounted="summary.meta.discounted ?? false"
          :overridden="summary.meta.overridden"
          :ui-config="{ pricing: { ex: [styles.product.pricing.ex] } }"
        />
        <CurrentPrice
          :current-price="summary.price.currentPrice"
          :monthly-from-current-price="
            summary.price.monthlyFromCurrentPrice ?? ''
          "
          :free="summary.meta.free ?? false"
          :ui-config="{
            pricing: { current: [styles.product.pricing.current] }
          }"
        />
      </footer>
    </div>

    <TermsDescription v-bind="summary" />
  </article>
</template>

<script lang="ts" setup>
// --- components
import { Link } from "@upmind-automation/upmind-ui";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- types
import { type BasketProductSummaryProps } from "./types";

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["update:quantity", "remove"]);

const styles = useStyles(
  [
    "product.summary",
    "product.summary.category",
    "product.summary.title",
    "product.option",
    "product.pricing"
  ],
  props,
  config
);
</script>
