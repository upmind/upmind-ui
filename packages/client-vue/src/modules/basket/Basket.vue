<template>
  <Layout :variant="layout">
    <template #navigation>
      <Back v-bind="storefrontRoute" :label="t('action.continue_shopping')" />
    </template>

    <template #content-header>
      <Hero
        :title="t('cart.basket_title')"
        :description="
          t('cart.basket_summary_desc', {
            count: count ?? 0,
            total: summary?.total ?? 0
          })
        "
      />
    </template>

    <template #content>
      <!-- Basket Errors -->
      <BasketErrors />

      <!-- Basket Products -->
      <Section
        id="basket-products"
        :title="t('cart.basket_products')"
        :ui-config="{
          section: {
            root: styles.basket.items.root,
            content: styles.basket.items.content
          } as any
        }"
        icon="list"
      >
        <ProductCards :open="open" @update:open="open = $event" />

        <template #action>
          <Link
            color="muted"
            :label="t('action.details_toggle', open ? 0 : 1)"
            @click="open = !open"
            size="sm"
          />
        </template>
      </Section>

      <!-- Basket Fields -->
      <Section
        id="basket-fields"
        :title="t('text.additional_details')"
        :class="styles.basket.customFields.root"
        :ui-config="{
          section: {
            root: styles.basket.items.root,
            content: styles.basket.items.content
          } as any
        }"
        icon="file-attachment-01"
      >
        <Form
          v-if="!fieldsMeta.isLoading"
          :additional-errors="fieldsErrors?.data"
          :model-value="fieldsModel"
          :touched="route?.hash === '#basket-fields'"
          :schema="fieldsSchema"
          :uischema="fieldsUischema"
          @reject="fieldsClear"
          @resolve="fieldsUpdate"
          @update:modelValue="fieldsUpdate"
          no-actions
          autosave
        />
      </Section>
    </template>

    <template #aside>
      <Section
        id="basket-summary"
        :title="t('text.summary')"
        :class="styles.basket.aside"
        icon="shopping-bag-02"
      >
        <Summary />

        <footer class="w-full">
          <Button
            :to="{ name: ROUTE.CHECKOUT }"
            :disabled="
              !fieldsMeta.isComplete ||
              meta.isProcessing ||
              meta.isLoading ||
              !meta.hasProducts ||
              meta.hasInvalidProducts
            "
            block
            size="lg"
            :loading="meta.isProcessing || meta.isLoading"
            :label="t('action.proceed_to_checkout')"
            icon-append="arrow-right"
          />
        </footer>
      </Section>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
// --- internal
import {
  useBasket,
  useBasketFields,
  useDataLayer,
  useBrand,
  ROUTE,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basket.config";

// --- components
import { RouterLink } from "vue-router";
import { Button, Link } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Hero from "../../components/hero/Hero.vue";
import Summary from "./components/Summary.vue";
import ProductCards from "./product/BasketProductCards.vue";
import Form from "../../components/form/Form.vue";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/section/Section.vue";
import BasketErrors from "./components/BasketErrors.vue";

// --- types
import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, isReady, count, summary } = useBasket();
const { storefrontRoute } = useBrand();
const { currentRoute } = useRoutingEngine();
const route = useRoute();

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();

const open = ref(false);

await isReady();

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
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

const { dataLayer } = useDataLayer();
dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
