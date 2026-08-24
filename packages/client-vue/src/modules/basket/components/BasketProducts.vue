<template>
  <Section
    id="basket-products"
    :label="t(meta.label)"
    :icon="meta.icon"
    :border="false"
    :actions="meta.actions"
  >
    <slot name="products" :open="open">
      <ProductCards
        v-model:open="open"
        :edit-route="props.editRoute"
        :disabled="props.disabled"
        @resolve="emits('resolve')"
      >
        <!-- the loaded product shows its inline config below the summary, so
             the loading state mirrors it -->
        <template v-if="props.configurable" #skeleton>
          <ConfigSkeleton />
        </template>
      </ProductCards>
    </slot>
  </Section>

  <!-- required basket custom fields gate the proceed CTA, so the form must be
       collectable on this step in every layout -->
  <BasketFieldsSection />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBasketProducts } from "@upmind-automation/headless";
import Section from "../../../components/section/Section.vue";
import ProductCards from "../../basket-product/components/card/BasketProductCards.vue";
import BasketFieldsSection from "./BasketFieldsSection.vue";
// --- types
import type { BasketProductsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<BasketProductsProps>(), {
  configurable: false
});

const emits = defineEmits(["resolve"]);

// -----------------------------------------------------------------------------

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });

const { meta: productsMeta } = useBasketProducts();

// inline-configurable products (the "Your Order" card) vs the stepped
// read-only product list, which offers a toggle for the hidden details
const meta = computed(() => {
  if (props.configurable) {
    return {
      label: "cart.your_order",
      icon: "shopping-bag-02",
      actions: []
    };
  }

  const actions = [];
  if (productsMeta.value.hasDetails) {
    actions.push({
      label: t("action.details_toggle", open.value ? 0 : 1),
      handler: () => (open.value = !open.value)
    });
  }

  return {
    label: "cart.basket_products",
    icon: "list",
    actions
  };
});
</script>
