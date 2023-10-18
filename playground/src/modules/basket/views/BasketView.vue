<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket</h2>

      <div class="actions">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div class="content">
      <form @submit.prevent="addProduct(model)">
        <fieldset>
          <label for="product">Product</label>
          <select v-model="model.product">
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
        </fieldset>

        <div class="actions">
          <button type="submit" :disabled="meta.isProcessing || !model.product">
            add to basket
          </button>

          <button
            type="reset"
            v-if="model.product"
            :disabled="meta.isProcessing"
            @click.prevent="model.product = null"
          >
            cancel
          </button>
        </div>
      </form>

      <hr />

      <template v-if="meta.needsConfiguring">
        <h3>
          We have
          <em class="primary">{{ queue?.context?.items?.length }}</em> item{{
            queue?.context?.items?.length > 1 ? "s" : ""
          }}
          that need{{ queue?.context?.items?.length == 1 ? "s" : "" }}
          configuring before
          {{ queue?.context?.items?.length > 1 ? "they" : "it" }}
          can be added to the basket

          <code><pre></pre></code>
        </h3>

        <!-- <template v-if="meta?.canChangeQuantity || true">
        <button
          class="prepend"
          @click.prevent="increment"
          :disabled="!meta.isAvailable"
        >
          +
        </button>

        <input type="number" v-model="model.quantity" min="1" max="10" />

        <button
          class="append"
          @click.prevent="decrement"
          :disabled="!meta.isAvailable"
        >
          -
        </button>
      </template> -->
      </template>

      <template v-if="meta.hasItems">
        <h3>
          We have <em class="primary">{{ basket.products.length }}</em> item{{
            basket.products.length > 1 ? "s" : ""
          }}
          in the basket

          <ul class="cards">
            <li v-for="product in basket.products" class="card">
              <h4 class="title">{{ product.product_name }}</h4>
              <h5 class="subtitle">{{ product.description }}</h5>

              <dl class="details">
                <dt>Quantity:</dt>
                <dd>{{ product.quantity }}</dd>
                <dt>Price:</dt>
                <dd>{{ product.total_amount_formatted }}</dd>
                <dt>Billing Cycle:</dt>
                <dd>{{ product.billing_cycle_months }}</dd>
              </dl>
            </li>
          </ul>
        </h3>
        <!-- <template v-if="meta?.canChangeQuantity || true">
        <button
          class="prepend"
          @click.prevent="increment"
          :disabled="!meta.isAvailable"
        >
          +
        </button>

        <input type="number" v-model="model.quantity" min="1" max="10" />

        <button
          class="append"
          @click.prevent="decrement"
          :disabled="!meta.isAvailable"
        >
          -
        </button>
      </template> -->
      </template>
    </div>

    <footer>
      <Debug
        v-if="queue"
        title="Queue"
        :state="queue.value"
        :values="queue.context.items"
        :errors="queue.context.errors"
      ></Debug>

      <Debug
        :open="{ meta: true }"
        title="Basket"
        :state="state"
        :model="model"
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
const { state, basket, errors, meta, send, queue } = useBasket();

const products = [
  {
    type: "optgroup",
    label: "Simple Products",
    options: [
      {
        label: "Logo Design ( 99.99 )",
        value: "47d73824-8507-9315-345f-81e642d59e06"
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products with Options",
    options: [
      {
        label: "Blocks ( 1500 )",
        value: "3de78642-de53-9714-542c-21208469530d"
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products with Attributes",
    options: [
      {
        label: "Meeting ( FREE )",
        value: "47d73824-8507-9315-385b-81e642d59e06"
      },
      {
        label: "Consulting Block ( 1500 )",
        value: "5952098d-3de4-0917-e88b-31578626e347"
      }
    ]
  },
  {
    type: "optgroup",
    label: "Products With Provisioning",
    options: [
      {
        label: "Starter Hosting ( 5.00   )",
        value: "5d085e69-d562-3719-7d6f-218e940d4237"
      }
    ]
  }
];

const model = ref({
  product: null,
  quantity: 1
});

function increment() {
  model.value.quantity++;
  model.value.quantity = Math.min(model.value.quantity, 10);
}
function decrement() {
  model.value.quantity--;
  model.value.quantity = Math.max(model.value.quantity, 1);
}

function addProduct() {
  send({
    type: "ADD",
    data: model.value
  });

  model.value.product = null;
  model.value.quantity = 1;
}
</script>

<style scoped lang="scss">
hr {
  margin-top: 1rem;
  margin-bottom: 2rem !important;
  border: none;
  border-top: 1px solid var(--color-border);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 1em;
  margin: 1em 0;
}

.card {
  background-color: var(--upm-c-white-soft);
  padding: 1em;
  border: 1px solid var(--color-border);
  border-radius: 0.25em;
  transition: all 200ms linear;

  &.info {
    background-color: var(--upm-c-info);
  }
  &.warning {
    background-color: var(--upm-c-warning);
  }
  &.error {
    background-color: var(--upm-c-error);
  }
  &.success {
    background-color: var(--upm-c-success);
  }

  // &:hover {
  //   box-shadow: 0 0 0.5em 0.25em rgba(0, 0, 0, 0.1);
  // }

  .title {
    font-size: 1.25em;
    font-weight: bold;
  }
  .subtitle {
    font-size: 1em;
    font-style: italic;
  }

  .details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 0.5em;
    margin-top: 1em;
    font-size: 0.825em;

    dt {
      font-weight: bold;
    }
    dd {
      font-weight: normal;
      text-align: right;
    }
  }
}
</style>
