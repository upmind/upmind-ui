<template>
  <Layout :variant="uiCart?.layout" minimal>
    <template #navigation>
      <Back v-bind="storefrontRoute" :label="t('action.continue_shopping')" />
    </template>

    <template #header>
      <Header
        :title="t('cart.basket_title')"
        :description="
          t('cart.basket_summary_desc', {
            count: products?.length ?? 0,
            total: summary?.total ?? 0
          })
        "
      />
    </template>

    <template #default>
      <Section
        :title="t('cart.basket_products')"
        :ui-config="{
          section: {
            root: styles.basket.items.root,
            content: styles.basket.items.content
          } as any
        }"
      >
        <ProductCards :open="open" @update:open="open = $event" />

        <template #action>
          <Link
            color="muted"
            :label="t('action.details_toggle', open ? 0 : 1)"
            @click="open = !open"
          />
        </template>
      </Section>

      <Section
        :title="t('text.additional_details')"
        :class="styles.basket.customFields.root"
        :ui-config="{
          section: {
            root: styles.basket.items.root,
            content: styles.basket.items.content
          } as any
        }"
      >
        <Form
          v-if="!fieldsMeta.isLoading"
          :additional-errors="fieldsErrors?.data"
          :model-value="fieldsModel"
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
      <Section :title="t('text.summary')" :class="styles.basket.aside" aside>
        <Summary />

        <footer class="w-full">
          <Button
            :as="RouterLink"
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

    <template #aside-footer>
      <Alert
        v-if="meta.hasInvalidProducts"
        color="danger"
        icon="alert-triangle"
        :description="t('cart.basket_products_review_msg')"
      >
        <template #title>
          <i18n-t
            keypath="cart.basket_products_require_attention_msg"
            tag="span"
            :plural="productsInvalid.length"
            scope="global"
          />
        </template>
        <ol class="list-disc p-6 py-2 text-left">
          <li
            v-for="basketItem in productsInvalid"
            :key="basketItem.id"
            class="marker:text-inherit"
          >
            <router-link
              class="text-md/tight text-inherit underline"
              :to="{
                name: 'product.edit',
                params: { bpid: basketItem.id }
              }"
            >
              <span>{{ basketItem?.productDetails?.title }}</span>
            </router-link>
          </li>
        </ol>
      </Alert>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketFields,
  useDataLayer,
  useBrand,
  ROUTE
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basket.config";

// --- components
import { Layout, Button, Alert, Link } from "@upmind-automation/upmind-ui";
import Header from "../../components/content/Header.vue";
import Summary from "./components/Summary.vue";
import ProductCards from "./product/BasketProductCards.vue";
import Form from "../../components/form/Form.vue";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/content/LayoutSection.vue";
import { isEmpty, omitBy } from "lodash-es";
import { RouterLink } from "vue-router";

// --- types
import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, productsInvalid, isReady, products, summary } = useBasket();
const { uiCart, storefrontRoute } = useBrand();

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

const basketMeta = computed(() => {
  return {
    variant: uiCart.value?.layout
  };
});

const styles = useStyles(
  ["basket.expand", "basket.items", "basket.customFields", "basket.aside"],
  basketMeta,
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
