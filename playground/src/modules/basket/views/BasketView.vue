<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket is {{ state }}</h2>

      <slot name="actions">
        <button @click="addProduct">addProduct</button>
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
const { state, values, send } = useBasket();

function addProduct() {
  send({
    type: "PRODUCT.ADD",
    data: {
      product_id: "d7382485-0793-157e-622c-91e642d59e06",
      billing_cycle_months: 1,
      quantity: 1
    }
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
