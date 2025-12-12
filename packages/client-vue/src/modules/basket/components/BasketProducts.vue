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
  >
    <slot name="products" :open="open">
      <ProductCards v-model:open="open" :edit-route="props.editRoute" />
    </slot>

    <template #actions>
      <Link
        color="muted"
        :label="t('action.details_toggle', open ? 0 : 1)"
        @click="open = !open"
        size="sm"
      />
    </template>
  </Section>

  <BasketFieldsSection />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, type RouteLocationAsRelativeGeneric } from "vue-router";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import { Link } from "@upmind-automation/upmind-ui";
import ProductCards from "../../basket-product/components/card/BasketProductCards.vue";
import Section from "../../../components/section/Section.vue";
import BasketFieldsSection from "./BasketFieldsSection.vue";

// --- types
import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  editRoute: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();

const open = defineModel<boolean>("open", { default: false });

const layout = computed(() => {
  return route?.meta?.template;
});

const styles = useStyles(
  ["basket.expand", "basket.items", "basket.customFields", "basket.aside"],
  { variant: layout.value },
  config
) as ComputedRef<{
  basket: {
    aside: string;
    expand: string;
    items: {
      root: string;
      content: string;
    };
    customFields: {
      root: string;
    };
  };
}>;
</script>
