<template>
  <section :class="styles.product.header.info.root">
    <div :class="styles.product.header.info.container">
      <Badge
        v-if="productDetails?.badge"
        v-bind="productDetails?.badge"
        size="sm"
        variant="muted"
        color="promo"
      />

      <Badge
        v-else-if="meta?.discounted || preservePromotion"
        :label="t('text.on_sale')"
        icon="tag-02"
        size="sm"
        variant="muted"
        color="promo"
        :class="styles.product.header.info.promotion"
      />

      <div>
        <Link
          v-if="navigate"
          :to="{
            ...props.configureRoute,
            params: {
              pid: props.id
            },
            query: {
              [QUERY_PARAMS.BILLING_CYCLE_MONTHS]: selectedTerm
            }
          }"
          tabindex="-1"
          @click="doResolve"
        >
          <h3 :class="styles.product.header.info.title">
            {{ productDetails?.title }}
          </h3>
        </Link>

        <h3 v-else :class="styles.product.header.info.title">
          {{ productDetails?.title }}
        </h3>

        <DisplayPrice
          v-if="props.productDetails?.displayPrice"
          v-bind="props.productDetails.displayPrice"
          :class="styles.product.header.info.terms"
        />
      </div>
    </div>

    <ProductDescription
      v-if="!hideDescription"
      :description="productDetails?.description"
      :class="styles.product.header.info.description"
    />
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { QUERY_PARAMS } from "@upmind-automation/headless";

// --- components
import { useStyles, Badge, Link } from "@upmind-automation/upmind-ui";
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductDescription from "./ProductDescription.vue";

// --- config
import config from "./card.config";

// --- types
import type { ProductInfo } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductInfo>();

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

function doResolve() {
  if (!props.id) return;
  emit("resolve", props.id);
}
</script>
