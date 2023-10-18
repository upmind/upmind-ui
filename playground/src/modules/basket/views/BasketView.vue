<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket</h2>

      <div class="actions">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div class="content">
      <form>
        <select v-model="selected">
          <component
            v-for="(item, index) in products"
            :key="`item-${index}`"
            :is="item.type || 'option'"
            v-bind="item"
          >
            <option
              v-for="(subitem, subindex) in item?.options"
              :key="`item-${index}-${subindex}`"
              v-bind="subitem"
            ></option>
          </component>
        </select>
        <button @click="addProduct" :disabled="!meta.isAvailable || !selected">
          +
        </button>
      </form>
    </div>

    <footer>
      <Debug
        title="Basket"
        :state="state"
        :values="basket"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBasket } from "..";
import Debug from "@/components/Debug.vue";
const { state, basket, errors, meta, send } = useBasket();

const products = [
  {
    type: "optgroup",
    label: "Simple Products",
    options: [
      {
        label: "Logo Design ( 99.99 )",
        value: { product: "47d73824-8507-9315-345f-81e642d59e06", quantity: 1 }
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products with Options",
    options: [
      {
        label: "Blocks ( 1500 )",
        value: { product: "3de78642-de53-9714-542c-21208469530d", quantity: 1 }
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products with Attributes",
    options: [
      {
        label: "Meeting ( FREE )",
        value: { product: "47d73824-8507-9315-385b-81e642d59e06", quantity: 1 }
      },
      {
        label: "Consulting Block ( 1500 )",
        value: { product: "5952098d-3de4-0917-e88b-31578626e347", quantity: 1 }
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products With Provisioning",
    options: [
      {
        label: "Starter Hosting ( 5.00   )",
        value: { product: "5d085e69-d562-3719-7d6f-218e940d4237", quantity: 1 }
      }
    ]
  }
];
const selected = ref();

function addProduct() {
  send({
    type: "ADD",
    data: selected.value
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
