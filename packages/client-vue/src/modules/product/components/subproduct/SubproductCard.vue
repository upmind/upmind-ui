<template>
  <section :class="styles.card.root">
    <header :class="styles.card.header.root">
      <div :class="styles.card.header.content">
        <div :class="styles.card.header.titleWrapper">
          <h5 :class="styles.card.header.title">{{ title }}</h5>

          <Promotion
            v-for="promotion in props.promotions"
            :key="promotion.code.toString()"
            v-bind="promotion"
            size="sm"
          />
        </div>

        <div
          v-if="props.price && !props.meta?.free"
          :class="styles.card.pricing.sm"
        >
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.meta"
            :cycle="props.cycle"
          />
        </div>
      </div>

      <div :class="styles.card.header.actions">
        <NumberField
          v-if="quantifiable && quantity"
          :disabled="processing"
          :min="min"
          :max="max"
          :step="step"
          :model-value="quantity"
          :default-value="quantity || step"
          @update:model-value="doUpdateQuantity"
          size="sm"
          width="sm"
          variant="minimal"
          @click.stop
          @keydown.enter.prevent.stop
        />

        <div :class="styles.card.pricing.lg">
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.meta"
            :cycle="props.cycle"
          />
        </div>
      </div>
    </header>

    <p :class="styles.card.excerpt" v-if="props.excerpt">
      {{ props.excerpt }}
    </p>
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./subproduct-card.config";

// --- components
import { NumberField } from "@upmind-automation/upmind-ui";
import SubproductCardPricing from "./SubproductCardPricing.vue";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";

// --- types
import type { ComputedRef } from "vue";
import type { SubproductCardProps } from "./types";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:quantity"]);
const props = defineProps<SubproductCardProps>();

const meta = computed(() => ({
  isMinimal: props.minimal
}));

const styles = useStyles(
  ["card", "card.header", "card.pricing"],
  meta,
  config
) as ComputedRef<{
  card: {
    root: string;
    header: {
      root: string;
      content: string;
      titleWrapper: string;
      title: string;
      actions: string;
    };
    pricing: {
      sm: string;
      lg: string;
    };
    excerpt: string;
  };
}>;

function doUpdateQuantity(quantity: number | undefined) {
  if (!quantity) return;
  emit("update:quantity", quantity);
}
</script>
