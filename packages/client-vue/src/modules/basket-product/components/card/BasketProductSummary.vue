<template>
  <article class="flex flex-col gap-2 lg:gap-4" v-auto-animate>
    <header class="flex gap-3">
      <Link
        v-if="productDetails.imgUrl"
        v-bind="props.editRoute"
        :class="styles.product.summary.imageRoute"
      >
        <img
          :src="productDetails.imgUrl"
          :alt="summary.title"
          :class="styles.product.summary.image"
        />
      </Link>

      <div class="w-full">
        <div class="flex justify-between">
          <div class="flex items-center gap-2">
            <h5 class="text-faint text-sm font-normal">
              {{ summary.category }}
            </h5>

            <Link
              v-if="isMobile && !isEmpty(filteredDetails)"
              @click="open = !open"
              color="muted"
              aria-label="Product information"
            >
              <Icon icon="info-circle" size="xs" class="[&>svg]:p-[2px]" />
            </Link>
          </div>

          <Tooltip :label="t('action.remove')" color="neutral">
            <Link :aria-label="t('action.remove')" @click="doRemove">
              <Icon icon="trash-01" size="xs" class="[&>svg]:p-[2px]" />
            </Link>
          </Tooltip>
        </div>

        <hgroup class="flex items-center gap-2">
          <Link v-bind="props.editRoute" offset="2" class="no-underline">
            <h3 class="text-xl-tight font-medium break-all">
              {{ summary.title }}
            </h3>
          </Link>

          <template v-if="!isMobile">
            <Tooltip
              v-if="!isEmpty(filteredDetails)"
              :label="t('action.show_details')"
            >
              <Link @click="open = !open" aria-label="Product information">
                <Icon icon="info-circle" size="xs" class="[&>svg]:p-[2px]" />
              </Link>
            </Tooltip>

            <Promotion
              v-for="(promotion, index) in summary.promotions"
              :key="index"
              v-bind="promotion"
              :disabled="error"
            />
          </template>
        </hgroup>
      </div>
    </header>

    <BasketProductConfigurationDetails
      v-if="open && !isEmpty(filteredDetails)"
      :id="id"
      :details="filteredDetails"
      :edit-route="props.editRoute"
    />

    <RequiredAlert v-if="error" :id="id" :edit-route="props.editRoute" />

    <footer class="flex flex-col justify-between gap-2 lg:flex-row">
      <TermsDescription v-bind="summary" :separate="!isMobile" />

      <div class="flex items-end justify-between gap-4 lg:justify-end">
        <QuantityField
          v-bind="productDetails"
          :id="id"
          :quantity="quantity"
          @update:quantity="doUpdateQuantity"
        />

        <div
          class="flex flex-row flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-0"
        >
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
import { Link, Icon, Tooltip } from "@upmind-automation/upmind-ui";
import RequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";
import BasketProductConfigurationDetails from "./BasketProductConfigurationDetails.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";
import { isEmpty, includes, some } from "lodash-es";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { ComputedRef } from "vue";
import { computed } from "vue";

const { t } = useI18n();

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["update:quantity", "remove", "update:open"]);

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

const open = useVModel(props, "open", emits);

const filteredDetails = computed(() =>
  props.details.filter((d, index) => {
    // Show primary price unless it's a one-off with cycle 0
    if ((!index && d.cycle) || props.details.length === 1) {
      return !d.meta?.invalid && !d.name?.includes("provision_field");
    }

    return (
      !includes(props.pricing, d.id) &&
      !d.meta?.invalid &&
      !d.name?.includes("provision_field")
    );
  })
);

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}

function doRemove() {
  emits("remove");
}
</script>
