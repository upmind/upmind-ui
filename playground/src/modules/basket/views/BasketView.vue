<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket is {{ state }}</h2>

      <slot name="actions"></slot>
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
const { state, values } = useBasket();
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
