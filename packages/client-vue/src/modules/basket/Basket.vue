<template>
  <Layout :variant="uiCart?.layout" minimal>
    <template #navigation>
      <Back v-bind="route" i18n-key="basket.back" />
    </template>

    <template #header>
      <Header
        :title="t('basket.title')"
        :description="
          t('basket.description', [summary.total], products?.length || 0)
        "
      />
    </template>

    <template #default>
      <Section
        :title="t('basket.items')"
        :ui-config="{
          section: {
            root: styles.basket.items.root,
            content: styles.basket.items.content
          } as any
        }"
      >
        <ProductCards :open="open" @update:open="open = $event" />

        <template #action>
          <Button
            variant="link"
            color="muted"
            :label="t('basket.expand', open ? 0 : 1)"
            icon="sort-lines"
            @click="open = !open"
          />
        </template>
      </Section>

      <Section
        :title="t('customFields')"
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
      <Section :title="t('basket.summary.title')" :class="styles.basket.aside">
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
            color="primary"
            :loading="meta.isProcessing || meta.isLoading"
            :label="t('basket.summary.proceed')"
            icon="cart"
            pill
          />
        </footer>
      </Section>
    </template>

    <template #aside-footer>
      <Alert
        v-if="meta.hasInvalidProducts"
        color="error"
        icon="alert"
        :description="t('basket.requiresAction.summary.description')"
      >
        <template #title>
          <i18n-t
            keypath="basket.requiresAction.summary.title"
            tag="span"
            :plural="productsInvalid.length"
            scope="global"
          />
        </template>
        <ol class="ml-6 list-disc py-2 text-left">
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
import { Layout, Button, Alert } from "@upmind-automation/upmind-ui";
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
const { uiCart, storefrontUrl, hasStorefront } = useBrand();

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

const route = computed(() => {
  return omitBy(
    {
      to: !hasStorefront.value ? { name: ROUTE.CATALOGUE } : undefined,
      href: hasStorefront.value ? storefrontUrl.value : undefined
    },
    isEmpty
  );
});

const { dataLayer } = useDataLayer();
dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
