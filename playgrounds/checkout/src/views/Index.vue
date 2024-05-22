<template>
  <article class="flex flex-col items-center justify-center gap-4">
    <h1>Loading Basket...</h1>
    <section>
      <upw-dropdown
        v-if="productCatalogue.length >= 1"
        label="Select Product to Add to Basket"
        :prepend-avatar="plus"
        :items="productCatalogue"
      />
    </section>
  </article>
</template>

<script setup>
// --- external
import { ref } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";

// ---components
import { UpwDropdown } from "@upmind/client-vue";

// ---------------------------------------------------
const { meta, addProduct } = useBasket();

const productCatalogue = [
  {
    label: "Simple Products",
    children: [
      {
        label: "Logo Design ( 99.99 )",
        value: "47d73824-8507-9315-345f-81e642d59e06",
      },
    ],
  },
  {
    label: "Products with Options",
    children: [
      {
        label: "Blocks ( 1500 )",
        value: "3de78642-de53-9714-542c-21208469530d",
      },
    ],
  },
  {
    label: "Products with Attributes",
    children: [
      {
        label: "Domain ( Terms Apply )",
        value: "78985742-6489-7012-096c-21e325d0ed36",
      },
      {
        label: "Meeting ( FREE )",
        value: "47d73824-8507-9315-385b-81e642d59e06",
      },
      {
        label: "Consulting Block ( 1500 )",
        value: "5952098d-3de4-0917-e88b-31578626e347",
      },
    ],
  },
  {
    label: "Products With Provisioning",
    children: [
      {
        label: "Starter Hosting ( 5.00   )",
        value: "5d085e69-d562-3719-7d6f-218e940d4237",
      },
    ],
  },
];

const model = ref({
  product_id: null,
  quantity: 1,
});
</script>
