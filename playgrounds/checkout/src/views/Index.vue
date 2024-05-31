<template>
  <article class="flex flex-col items-center justify-center gap-4">
    <h1 class="flex justify-center gap-4">
      <span>Basket</span>

      <span v-if="meta.isLoading">
        is <span class="text-primary">Loading&hellip;</span>
      </span>

      <span v-if="meta.isProcessing">
        is <span class="text-primary">Updating</span>
      </span>

      <template v-if="!meta.isLoading && !meta.isProcessing">
        <!-- Main Statuses -->
        <span v-if="meta.isComplete">
          is <span class="text-primary">Paid and Complete!</span>
        </span>

        <span v-else-if="meta.isPaying">
          is <span class="text-primary">Attempting Payment</span>
        </span>

        <span v-else-if="meta.isConverting">
          is <span class="text-primary">Converting to an Order</span>
        </span>

        <span v-else-if="meta.isCheckout">
          is <span class="text-primary">Gathering Payment Details</span>
        </span>

        <span v-else-if="meta.isReadyForCheckout">
          is <span class="text-primary">Ready for Checkout</span>
        </span>

        <!-- ----- -->
        <!-- Shopping Statuses -->
        <span v-else-if="!meta.isAvailable">
          is <span class="text-primary">Empty</span>
        </span>

        <span v-else-if="meta.needsUpdating">
          needs <span class="text-primary">Updating</span>
        </span>

        <!-- <span v-else-if="!meta.hasProducts">
          needs <span class="text-warning">Configuring</span>
        </span> -->

        <!-- <span v-else-if="meta.hasErrors">
          needs <span class="text-warning">Attention</span>
        </span> -->

        <span v-else>
          needs <span class="text-warning">Information</span>

          <!-- is <span class="text-warning">NOT</span> Ready for Checkout -->
        </span>
      </template>
    </h1>

    <section>
      <upw-dropdown
        v-if="!meta.isLoading && productCatalogue.length >= 1"
        label="Add to Basket"
        prepend-icon="basket-plus"
        :items="productCatalogue"
        :loading="meta.isProcessing"
      />
    </section>

    <h3 v-if="meta.isAvailable" class="font-medium">
      There {{ items.length > 1 ? "are" : "is" }}
      <span class="text-primary">
        {{ items.length }}
      </span>
      <span> product{{ items.length > 1 ? "s" : "" }} </span>
      in the Basket
    </h3>

    <upw-button
      v-if="meta.isAvailable"
      label="Proceed to Checkout"
      prepend-icon="basket"
      append-icon="arrow-right"
      @click="() => $router.push({ name: 'checkout' })"
    />
  </article>
</template>

<script setup>
// --- external

// --- internal

// ---components
import { useBasket, UpwDropdown, UpwButton } from "@upmind/client-vue";

// --- utils
// ---------------------------------------------------
const { items, meta, addProduct } = useBasket();

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
</script>
