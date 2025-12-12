<template>
  <article>
    <div class="flex items-center justify-between">
      <hgroup>
        <h5 class="text-faint text-sm font-normal">
          {{ summary.category }}
        </h5>
        <Link v-bind="props.editRoute" offset="2" class="no-underline">
          <h3 class="text-xl-tight font-medium break-all">
            {{ summary.title }}
          </h3>
        </Link>
      </hgroup>

      <footer class="flex flex-col items-end">
        <ExPrice
          :regular-price="summary.price.regularPrice"
          :monthly-from-regular-price="
            summary.price.monthlyFromRegularPrice ?? ''
          "
          :discounted="summary.meta.discounted ?? false"
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
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Link, Icon, Tooltip } from "@upmind-automation/upmind-ui";
import RequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { ComputedRef } from "vue";

const { t } = useI18n();

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["update:quantity", "remove"]);

const styles = useStyles(
  ["product.summary", "product.pricing"],
  props,
  config
) as ComputedRef<{
  product: {
    summary: {
      container: string;
      image: string;
      imageRoute: string;
    };
    pricing: {
      current: string;
      ex: string;
    };
  };
}>;

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}

function doRemove() {
  emits("remove");
}
</script>
