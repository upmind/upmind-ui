<template>
  <article class="flex flex-col items-center justify-center gap-4">
    <img
      src="/background.svg"
      alt="page background"
      class="absolute bottom-0 left-0 right-0 top-9 z-0 object-cover"
    />

    <upm-basket-empty v-if="meta.isEmpty" />
    <template v-else>
      <upm-basket-loading />

      <!-- safety check in case anything goes wrong  -->
      <footer v-if="showActions">
        <h3 v-if="meta.isAvailable" class="font-medium">
          {{ $tc("basket.loading.count", items.length) }}
        </h3>

        <upw-button
          v-if="meta.isAvailable"
          block
          :label="$t('basket.loading.actions.checkout')"
          prepend-icon="basket"
          append-icon="arrow-right"
          @click="() => $router.push({ name: 'checkout' })"
        />
      </footer>
    </template>
  </article>
</template>

<script setup>
// --- external
import { useRoute, useRouter } from "vue-router";

// --- internal

// ---components
import {
  useBasket,
  UpwButton,
  UpmBasketEmpty,
  UpmBasketLoading,
} from "@upmind/client-vue";
import { forEach, isArray, get } from "lodash-es";
import { ref } from "vue";

// --- utils
// ---------------------------------------------------
const { items, meta, addProduct, updateBasket, isReady } = useBasket();

const productCatalogue = [
  {
    label: "Simple Products",
    children: [
      {
        label: "Logo Design ( 99.99 )",
        action: () => {
          addProduct({
            product_id: "47d73824-8507-9315-345f-81e642d59e06",
            quantity: 1,
          });
        },
      },
    ],
  },
  {
    label: "Products with Options",
    children: [
      {
        label: "Blocks ( 1500 )",
        action: () =>
          addProduct({
            product_id: "3de78642-de53-9714-542c-21208469530d",
            quantity: 1,
          }),
      },
    ],
  },
  {
    label: "Products with Attributes",
    children: [
      {
        label: "Domain ( Terms Apply )",
        action: () =>
          addProduct({
            product_id: "78985742-6489-7012-096c-21e325d0ed36",
            quantity: 1,
          }),
      },
      {
        label: "Meeting ( FREE )",
        action: () =>
          addProduct({
            product_id: "47d73824-8507-9315-385b-81e642d59e06",
            quantity: 1,
          }),
      },
      {
        label: "Consulting Block ( 1500 )",
        action: () =>
          addProduct({
            product_id: "5952098d-3de4-0917-e88b-31578626e347",
            quantity: 1,
          }),
      },
    ],
  },
  {
    label: "Products With Provisioning",
    children: [
      {
        label: "Starter Hosting ( 5.00   )",
        action: () =>
          addProduct({
            product_id: "5d085e69-d562-3719-7d6f-218e940d4237",
            quantity: 1,
          }),
      },
    ],
  },
];

// check if weve been given a product to add to the basket via route query params
const route = useRoute();
const router = useRouter();

const product = get(route.query, "product");
const products = ref([]);

const showActions = ref(false);

function gotoCheckout() {
  if (!meta.value.isEmpty) router.push({ name: "checkout" });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

isReady()
  .then(() => {
    if (product) {
      forEach(isArray(product) ? product : [product], product_id => {
        products.value.push(addProduct({ product_id, quantity: 1 }));
      });

      return Promise.all(products.value).then(updateBasket);
    }
  })
  .then(() => gotoCheckout())
  .finally(() => {
    // as a failsafe we show the actions if the basket is available and we havenot for some reason redirected
    // add a delay to prevent fout
    delay(1000).then(() => (showActions.value = meta.value.isAvailable));
  });
</script>
