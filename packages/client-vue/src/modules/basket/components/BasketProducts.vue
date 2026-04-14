<template>
  <Section
    id="basket-products"
    :label="t('cart.basket_products')"
    icon="list"
    :ui-config="{
      section: {
        root: styles.basket.items.root,
        content: styles.basket.items.content
      } as any
    }"
    :card="false"
    :border="false"
    :actions="actions"
  >
    <slot name="products" :open="open">
      <ProductCards v-model:open="open" :edit-route="props.editRoute" />
    </slot>
  </Section>

  <BasketFieldsSection />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, type RouteLocationAsRelativeGeneric } from "vue-router";

// --- internal
import { useBasketProducts } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import ProductCards from "../../basket-product/components/card/BasketProductCards.vue";
import Section from "../../../components/section/Section.vue";
import BasketFieldsSection from "./BasketFieldsSection.vue";

// --- types

// -----------------------------------------------------------------------------
const props = defineProps<{
  editRoute: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();

const open = defineModel<boolean>("open", { default: false });

const { meta } = useBasketProducts();

const actions = computed(() => {
  if (meta.value.hasDetails) {
    return [
      {
        label: t("action.details_toggle", open.value ? 0 : 1),
        handler: () => (open.value = !open.value)
      }
    ];
  }

  return [];
});

const layout = computed(() => {
  return route?.meta?.template;
});

const styles = useStyles(
  ["basket.expand", "basket.items", "basket.customFields", "basket.aside"],
  { variant: layout.value },
  config
);
</script>
