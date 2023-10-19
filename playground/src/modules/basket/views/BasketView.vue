<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Basket</h2>

      <div class="actions">
        <slot name="actions">
          <form @submit.prevent="addProduct(model)">
            <fieldset>
              <select v-model="model.product" placeholder="Select product">
                <component
                  v-for="(item, index) in productCatalogue"
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

              <button
                type="submit"
                :disabled="meta.isProcessing || !model.product"
              >
                add to basket
              </button>

              <button
                type="reset"
                :disabled="meta.isProcessing || !model.product"
                @click.prevent="model.product = null"
              >
                cancel
              </button>
            </fieldset>
          </form>
        </slot>
      </div>
    </header>

    <div class="content" v-if="!meta.isLoading">
      <!-- status -->

      <div v-if="products?.length">
        <h3>
          We have <em class="success">{{ products.length }}</em> Product{{
            products.length > 1 ? "s" : ""
          }}
          in the basket
        </h3>
      </div>

      <div v-else>
        <h3>We <em class="error">don't have any</em> Products in the basket</h3>
      </div>

      <div v-if="meta.needsConfiguring">
        <h3>
          We have
          <em class="warning">{{ items?.length }}</em> item{{
            items?.length > 1 ? "s" : ""
          }}
          that need{{ items?.length == 1 ? "s" : "" }}
          configuring before
          {{ items?.length > 1 ? "they" : "it" }}
          can be added to the basket
        </h3>
      </div>

      <!-- cards -->
      <hr />

      <ul class="cards">
        <li v-for="product in products" :key="product.id">
          <section class="card success">
            <h4 class="title">{{ product.product_name }}</h4>
            <h5 class="subtitle">{{ product.description }}</h5>

            <dl class="summary">
              <dt>Quantity:</dt>
              <dd>{{ product.quantity }}</dd>
              <dt>Price:</dt>
              <dd>{{ product.total_amount_formatted }}</dd>
              <dt>Billing Cycle:</dt>
              <dd>{{ product.billing_cycle_months }}</dd>
            </dl>
          </section>
        </li>
        <li v-for="item in items" :key="item.id">
          <ProductConfig :item="item" @update:term="updateTerm"></ProductConfig>
        </li>
      </ul>
    </div>

    <div class="content" v-else>
      <h3>Loading...</h3>
    </div>

    <footer>
      <Debug
        :open="{ state: true }"
        title="Basket"
        :state="state"
        :model="model"
        :context="{ items, products, basket }"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBasket } from "..";
import ProductConfig from "../components/ProductConfig.vue";
import Debug from "@/components/Debug.vue";
const { state, basket, errors, meta, updateTerm, items, products, send } =
  useBasket();

const productCatalogue = [
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
  // {
  //   type: "optgroup",
  //   label: "Products with Options",
  //   options: [
  //     {
  //       label: "Blocks ( 1500 )",
  //       value: "3de78642-de53-9714-542c-21208469530d"
  //     }
  //   ]
  // },
  {
    type: "optgroup",
    label: "Products with Attributes",
    options: [
      {
        label: "Domain ( Terms Apply )",
        value: "78985742-6489-7012-096c-21e325d0ed36"
      },
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
  margin: 2rem 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.content > div:first-of-type {
  hr {
    display: none;
  }
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 1em;
  margin: 1em 0;
}

.card {
  color: var(--upm-c-black);
  background-color: var(--upm-c-white-soft);
  padding: 1em;
  border: 1px solid var(--color-border);
  border-radius: 0.25em;
  transition: all 200ms linear;

  &.info {
    background-color: var(--upm-c-info-muted);
    color: var(--upm-c-black);
  }
  &.warning {
    background-color: var(--upm-c-warning-muted);
    color: var(--upm-c-black);
  }
  &.error {
    background-color: var(--upm-c-error-muted);
    color: var(--upm-c-black);
  }
  &.success {
    background-color: var(--upm-c-success-muted);
    color: var(--upm-c-black);
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

  .summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 0.5em;
    margin-top: 1em;
    font-size: 0.875em;

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
