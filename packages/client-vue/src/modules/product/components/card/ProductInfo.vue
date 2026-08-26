<template>
  <section :class="cardHeaderInfoRootVariants()">
    <div :class="cardHeaderInfoContainerVariants()">
      <Badge v-if="detailsBadge" size="sm" appearance="muted" variant="promo">
        <Icon v-if="detailsBadge.icon" :icon="detailsBadge.icon" size="xs" />
        {{ detailsBadge.label }}
      </Badge>

      <Badge
        v-else-if="productDetails?.trialSupported"
        data-test-key="free-trial-badge"
        size="sm"
        appearance="muted"
        variant="promo"
      >
        <Icon icon="clock-stopwatch" size="xs" />
        {{ t("text.free_trial") }}
      </Badge>

      <Tooltip v-else-if="meta?.custom">
        <Badge
          size="sm"
          appearance="muted"
          variant="warning"
          :class="
            cardHeaderInfoPromotionVariants({
              preservePromotion: metaConfig.preservePromotion
            })
          "
        >
          <Icon icon="edit-01" size="xs" />
          {{ t("text.custom_price") }}
        </Badge>
        <template #content>{{
          t("text.price_manually_adjusted_msg")
        }}</template>
      </Tooltip>

      <Badge
        v-else-if="meta?.discounted || preservePromotion"
        size="sm"
        appearance="muted"
        variant="promo"
        :class="
          cardHeaderInfoPromotionVariants({
            preservePromotion: metaConfig.preservePromotion
          })
        "
      >
        <Icon icon="tag-02" size="xs" />
        {{ t("text.on_sale") }}
      </Badge>

      <Badge
        v-if="hideImage && productBadge && !isUnavailable"
        appearance="outline"
        variant="neutral"
      >
        <Icon v-if="productBadge.icon" :icon="productBadge.icon" size="xs" />
        {{ productBadge.label }}
      </Badge>

      <div>
        <Link v-if="navigate" :to="titleRoute" tabindex="-1" @click="doResolve">
          <h3 :class="cardHeaderInfoTitleVariants()">
            {{ title }}
          </h3>
        </Link>

        <h3 v-else :class="cardHeaderInfoTitleVariants()">
          {{ title }}
        </h3>

        <DisplayPrice
          v-if="!hideAnchorPrice && props.productDetails?.displayPrice"
          v-bind="props.productDetails.displayPrice"
          :class="cardHeaderInfoTermsVariants()"
        />
      </div>
    </div>

    <p
      v-if="productDetails?.excerpt && productMeta?.ui.productExcerpt.isVisible"
      :class="cardHeaderInfoDescriptionVariants()"
    >
      {{ productDetails?.excerpt || productDetails?.description }}
    </p>

    <ProductDescription
      v-else-if="!hideDescription"
      :description="productDetails?.description"
      :lineclamp="productMeta?.ui.productDescription.isClamped"
      :lines="toNumber(productMeta?.ui.productDescriptionClamp?.value)"
      :class="cardHeaderInfoDescriptionVariants()"
    />
  </section>
</template>

<script setup lang="ts">
import { Badge } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { QUERY_PARAMS } from "@upmind-automation/headless";
import { Icon } from "../../../../components/icon";
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductDescription from "./ProductDescription.vue";
import {
  cardHeaderInfoRootVariants,
  cardHeaderInfoContainerVariants,
  cardHeaderInfoTitleVariants,
  cardHeaderInfoTermsVariants,
  cardHeaderInfoDescriptionVariants,
  cardHeaderInfoPromotionVariants
} from "./variants";
import { isString, merge } from "lodash-es";
import { toNumber } from "lodash-es";
import type { ProductInfo } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductInfo>(), {
  hideAnchorPrice: false
});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

const detailsBadge = computed(() =>
  isString(props.productDetails?.badge)
    ? { label: props.productDetails.badge }
    : props.productDetails?.badge
);

const productBadge = computed(() =>
  isString(props.productMeta?.data.productBadge)
    ? { label: props.productMeta.data.productBadge }
    : props.productMeta?.data.productBadge
);

// -----------------------------------------------------------------------------

const { t } = useI18n();

const metaConfig = computed(() => ({
  preservePromotion: props.preservePromotion && !props.meta?.discounted
}));

const titleRoute = computed(() =>
  merge({}, props.configureRoute, {
    params: { pid: props.id },
    query: {
      [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: props.selectedTerm,
      autoupdate: "false"
    }
  })
);

const isUnavailable = computed(
  () => !!props.productMeta?.data.productUnavailable
);

function doResolve() {
  if (!props.id) return;
  if (isUnavailable.value) return;
  emit("resolve", props.id);
}
</script>
