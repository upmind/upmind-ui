<template>
  <section class="basket w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-full"
    >
      <div class="flex-1">
        <h2 class="title m-0">
          Basket

          <span v-if="!meta.hasProducts">
            is <span class="text-primary">Empty</span>
          </span>

          <span v-else-if="meta.needsUpdating">
            needs <span class="text-primary">Updating</span>
          </span>

          <span v-else-if="meta.isConfigured">
            is <span class="text-primary">Ready</span>
          </span>

          <span v-if="meta.isConfigured && meta.needsAuth"
            >, but needs <span class="text-primary">Auth</span>
          </span>

          <span v-if="meta.isReadyForCheckout">
            is <span class="text-primary">Ready for Checkout</span>
          </span>
        </h2>
      </div>

      <div class="flex-1" v-if="meta.isLoading || meta.isProcessing">
        <progress class="progress progress-primary w-1/2"></progress>
      </div>

      <div class="actions flex-none join justify-end">
        <slot name="actions">
          <form @submit.prevent="addProduct(model)">
            <fieldset>
              <select
                class="select select-bordered w-24 md:w-auto join-item"
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
            class="btn btn-primary join-item"
            type="submit"
            :disabled="meta.isProcessing || !model.productId"
            @click.prevent="addProduct(model)"
          >
            <!-- <div class="indicator"> -->
            <!-- <span class="indicator-item"> -->
            <!-- </span> -->

            <SquaresPlusIcon class="h-6 w-6" />
            <!-- <PlusIcon class="h-4 w-4 -ml-3" /> -->
            <!-- </div> -->
          </button>

          <!-- <button
            class="btn btn-ghost join-item"
            type="reset"
            :disabled="meta.isProcessing || !model.productId"
            @click.prevent="model.productId = null"
          >
            cancel
          </button> -->
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

      <section class="basket grid grid-cols-7 gap-8 py-4">
        <div class="cards col-span-5 list-none grid grid-cols-2 gap-4">
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
                  class="btn btn-secondary btn-sm btn-block mt-4"
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
          class="bg-primary text-primary-content border border-base-300 col-span-2 basket-summary rounded-md self-start p-4 text-center sticky top-20"
          v-if="items?.length"
        >
          <h4 class="text-primary-content">
            <strong class="text-xl px-2">{{ items.length }}</strong>
            Product{{ items.length > 1 ? "s" : "" }}
            in the basket
          </h4>

          <div class="totals">
            <div class="divider mt-8 uppercase">Total</div>

            <h1 class="text-primary-content">
              {{ basket?.unpaid_amount_formatted }}
            </h1>
          </div>

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
              class="btn btn-block mt-2"
              v-if="meta.canProcess"
              :disabled="meta.isProcessing"
              @click.prevent="updateBasket"
            >
              Update basket
            </button>
          </div>
        </aside>
      </section>

      <div v-if="meta.hasErrors" class="panel bg-error p-4 rounded-xl">
        <h3>We experienced an error updating the basket</h3>
        <code>
          <pre>{{ errors }}</pre>
        </code>
      </div>
    </div>

    <footer>
      <Debug
        :debugging="debugging"
        :open="{ state: true }"
        title="Basket"
        :state="state"
        :model="model"
        :context="{ items, basket }"
        :errors="errors"
        :meta="meta"
        class=""
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBasket } from "..";
import ProductConfig from "../components/ProductConfig.vue";
import Debug from "@/components/Debug.vue";
import { SquaresPlusIcon } from "@heroicons/vue/24/outline";

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

const debugging = ref(true);

const model = ref({
  productId: null,
  quantity: 1
});
</script>
