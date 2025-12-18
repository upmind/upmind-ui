<template>
  <article :class="styles.product.summary.article" v-auto-animate>
    <header :class="styles.product.summary.header.root">
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

      <div :class="styles.product.summary.header.content">
        <div :class="styles.product.summary.header.top">
          <div :class="styles.product.summary.category.root">
            <h5 :class="styles.product.summary.category.text">
              {{ summary.category }}
            </h5>

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
              {{ summary.title }}
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

    <RequiredAlert
      v-if="error"
      :id="id"
      size="sm"
      :edit-route="props.editRoute"
    />

    <footer :class="styles.product.summary.footer.root">
      <TermsDescription v-bind="summary" :separate="!isMobile" />

      <div :class="styles.product.summary.footer.price.root">
        <QuantityField
          v-bind="productDetails"
          :id="id"
          :quantity="quantity"
          @update:quantity="doUpdateQuantity"
        />

        <div :class="styles.product.summary.footer.price.container">
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
import { isEmpty, includes } from "lodash-es";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { ComputedRef } from "vue";
import { computed } from "vue";

const { t } = useI18n();

const props = defineProps<BasketProductSummaryProps>();

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
) as ComputedRef<{
  product: {
    summary: {
      article: string;
      header: {
        root: string;
        content: string;
        top: string;
      };
      category: {
        root: string;
        text: string;
      };
      title: {
        root: string;
        link: string;
        text: string;
      };
      icon: string;
      image: string;
      imageRoute: string;
      footer: {
        root: string;
        price: {
          root: string;
          container: string;
        };
      };
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
