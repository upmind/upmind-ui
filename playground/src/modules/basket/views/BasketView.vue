<template>
  <section class="basket">
    <header class="navbar bg-gray-100 rounded-md shadow-md sticky top-0 z-10">
      <div class="flex-1 px-4">
        <h2 class="title m-0">Basket</h2>
      </div>

      <div class="actions flex-none gap-2">
        <slot name="actions">
          <form @submit.prevent="addProduct(model)">
            <fieldset>
              <select
                class="select select-bordered w-24 md:w-auto"
                v-model="model.productId"
                placeholder="Select product"
              >
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
            </fieldset>
          </form>
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="meta.isProcessing || !model.productId"
            @click.prevent="addProduct(model)"
          >
            add to basket
          </button>

          <button
            class="btn btn-ghost"
            type="reset"
            :disabled="meta.isProcessing || !model.productId"
            @click.prevent="model.productId = null"
          >
            cancel
          </button>
        </slot>
      </div>
    </header>

    <div class="content" v-if="!meta.isLoading">
      <!-- <ul class="steps">
        <li class="step step-primary" data-content="?">Configure</li>
        <li class="step" data-content="★">Auth</li>
        <li class="step" data-content="$">Checkout</li>
        <li class="step" data-content="✓">Complete</li>
      </ul> -->

      <div v-if="!items?.length">
        <h3>We <em class="error">don't have any</em> Products in the basket</h3>
      </div>

      <section class="basket grid grid-cols-7 gap-4 py-4">
        <div class="cards col-span-5 list-none">
          <div v-for="item in items" :key="item.id">
            <ProductConfig
              :item="item"
              :id="item.id"
              :processing="meta.isProcessing"
              @remove="removeItem"
              @update:term="updateTerm"
              @update:quantity="updateQuantity"
              @update:attributes="updateAttributes"
              @update:options="updateOptions"
            >
              <template #actions="{ isConfigured, isNew, isDirty }">
                <button
                  v-if="isConfigured && (isNew || isDirty)"
                  class="secondary"
                  :disabled="meta.isProcessing"
                  @click.prevent="updateItem(item.id)"
                >
                  Update Item
                </button>
              </template>
            </ProductConfig>
          </div>
        </div>

        <aside
          class="prose col-span-2 basket-summary rounded-md self-start p-4 text-right sticky top-20"
          data-theme="dark"
          v-if="items?.length"
        >
          <h3 class="title">
            <em class="success">{{ items.length }}</em> Product{{
              items.length > 1 ? "s" : ""
            }}
            in the basket
          </h3>

          <dl class="totals">
            <dt><h2>Total</h2></dt>
            <dd>{{ basket?.unpaid_amount_formatted }}</dd>
          </dl>

          <div class="actions">
            <button
              class="btn btn-ghost btn-block"
              type="reset"
              :disabled="meta.isProcessing"
              @click.prevent="clearBasket"
            >
              Clear Basket
            </button>

            <button
              class="btn btn-secondary btn-block"
              v-if="meta.canProcess"
              :disabled="meta.isProcessing"
              @click.prevent="updateBasket"
            >
              Update basket
            </button>
          </div>
        </aside>
      </section>

      <div v-if="meta.hasErrors" class="panel bg-error">
        <h3>We experienced an error updating the basket</h3>
        <code>
          <pre>{{ errors }}</pre>
        </code>
      </div>
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
        :context="{ items, basket }"
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
const {
  state,
  basket,
  errors,
  meta,
  updateBasket,
  clearBasket,
  updateItem,
  addProduct,
  removeItem,
  updateTerm,
  updateQuantity,
  updateAttributes,
  updateOptions,
  updateProvisioning,
  items
} = useBasket();

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
  productId: null,
  quantity: 1
});
</script>
