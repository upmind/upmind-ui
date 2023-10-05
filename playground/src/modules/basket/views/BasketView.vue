<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket is {{ state }}</h2>

      <slot name="actions">
        <button @click="addProduct()" v-if="isAvailable">addProduct</button>
      </slot>
    </header>

    <div class="values">
      <code>
        <pre>{{ values }}</pre>
      </code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBasket } from "..";
const { state, values, send, isAvailable } = useBasket();

const products = [
  {
    product_id: "3de78642-de53-9714-542c-21208469530d",
    quantity: 1,
    billing_cycle_months: 0,
    total: 1500,
    options: [
      {
        billing_cycle_months: 0,
        order_type: 3,
        product_id: "320e4357-95e7-8d18-45ea-31643202d986",
        total: 2500,
        unit_quantity: 1,
        unit_total: 2500
      }
    ],
    attributes: [],
    start_trial: false
  },
  {
    product_id: "d7382485-0793-157e-622c-91e642d59e06",
    billing_cycle_months: 1,
    quantity: 1
  }
];

function addProduct(id = 0) {
  send({
    type: "PRODUCT.ADD",
    data: products[id]
  });
}
</script>

<style scoped lang="scss">
.brand {
  .values {
    margin-top: 1em;
    &:not(:last-child) {
      border-bottom: 1px solid whitesmoke;
      padding-bottom: 1em;
    }
  }
}
</style>
