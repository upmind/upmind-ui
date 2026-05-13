<template>
  <section :class="styles.product.header.info.root">
    <div :class="styles.product.header.info.container">
      <Badge
        v-if="productDetails?.badge"
        v-bind="
          isString(productDetails.badge)
            ? { label: productDetails.badge }
            : productDetails.badge
        "
        size="sm"
        variant="muted"
        color="promo"
      />

      <Badge
        v-else-if="productDetails?.trialSupported"
        :label="t('text.free_trial')"
        icon="clock-stopwatch"
        size="sm"
        variant="muted"
        color="promo"
      />

      <Tooltip
        v-else-if="meta?.overridden"
        :label="t('text.price_manually_adjusted_msg')"
      >
        <Badge
          :label="t('text.custom_price')"
          icon="edit-01"
          size="sm"
          variant="muted"
          color="warning"
          :class="styles.product.header.info.promotion"
        />
      </Tooltip>

      <Badge
        v-else-if="meta?.discounted || preservePromotion"
        :label="t('text.on_sale')"
        icon="tag-02"
        size="sm"
        variant="muted"
        color="promo"
        :class="styles.product.header.info.promotion"
      />

      <Badge
        v-if="hideImage && productMeta?.data.productBadge"
        v-bind="
          isString(productMeta.data.productBadge)
            ? { label: productMeta.data.productBadge }
            : productMeta.data.productBadge
        "
        variant="minimal"
        color="neutral"
      />

      <div>
        <Link v-if="navigate" :to="titleRoute" tabindex="-1" @click="doResolve">
          <h3 :class="styles.product.header.info.title">
            {{ title }}
          </h3>
        </Link>

        <h3 v-else :class="styles.product.header.info.title">
          {{ title }}
        </h3>

        <DisplayPrice
          v-if="!hideAnchorPrice && props.productDetails?.displayPrice"
          v-bind="props.productDetails.displayPrice"
          :class="styles.product.header.info.terms"
        />
      </div>
    </div>

    <p
      v-if="productDetails?.excerpt && productMeta?.ui.productExcerpt.isVisible"
      :class="styles.product.header.info.description"
    >
      {{ productDetails?.excerpt || productDetails?.description }}
    </p>

    <ProductDescription
      v-else-if="!hideDescription"
      :description="productDetails?.description"
      :lineclamp="productMeta?.ui.productDescription.isClamped"
      :lines="toNumber(productMeta?.ui.productDescriptionClamp?.value)"
      :class="styles.product.header.info.description"
    />
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { isString, merge } from "lodash-es";

// --- internal
import { QUERY_PARAMS } from "@upmind-automation/headless";
import config from "./card.config";

// --- components
import { useStyles, Badge, Link, Tooltip } from "@upmind-automation/upmind-ui";
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductDescription from "./ProductDescription.vue";

// --- utils
import { toNumber } from "lodash-es";

// --- types
import type { ProductInfo } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductInfo>(), {
  hideAnchorPrice: false
});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const metaConfig = computed(() => ({
  preservePromotion: props.preservePromotion && !props.meta?.discounted
}));

const styles = useStyles(
  ["product.header", "product.header.info"],
  metaConfig,
  config
);

const titleRoute = computed(() =>
  merge({}, props.configureRoute, {
    params: { pid: props.id },
    query: { [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: props.selectedTerm }
  })
);

function doResolve() {
  if (!props.id) return;
  emit("resolve", props.id);
}
</script>
