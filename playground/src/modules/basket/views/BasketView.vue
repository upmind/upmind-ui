<template>
  <section class="basket w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
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
        <currency-switcher
          v-if="currency"
          :model-value="currency"
          :currencies="currencies"
          :processing="meta.isLoading || meta.isProcessing"
          @update:modelValue="updateCurrency"
          class="mx-4"
        >
        </currency-switcher>
        <slot name="actions">
          <form @submit.prevent="addProduct(model)">
            <fieldset>
              <select
                class="select select-bordered w-24 md:w-auto join-item"
                v-model="model.product_id"
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
            :disabled="meta.isProcessing || !model.product_id"
            @click.prevent="addProduct(model)"
          >
            <!-- <div class="indicator"> -->
            <!-- <span class="indicator-item"> -->
            <!-- </span> -->

            <squares-plus-icon class="h-6 w-6" />
            <!-- <PlusIcon class="h-4 w-4 -ml-3" /> -->
            <!-- </div> -->
          </button>

          <!-- <button
            class="btn btn-ghost join-item"
            type="reset"
            :disabled="meta.isProcessing || !model.product_id"
            @click.prevent="model.product_id = null"
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
            <product-config
              :item="item"
              :id="item.id"
              :processing="meta.isProcessing"
              @remove="removeItem"
              @update:term="updateTerm"
              @update:quantity="updateQuantity"
              @update:attributes="updateAttributes"
              @update:options="updateOptions"
              @update:provisioning="updateProvisioning"
            >
              <template #actions="{ isConfigured, isNew, isDirty }">
                <button
                  v-if="isConfigured && (isNew || isDirty)"
                  class="btn btn-primary btn-sm btn-block mt-4"
                  :disabled="meta.isProcessing"
                  @click.prevent="updateItem(item.id)"
                >
                  Update Item
                </button>
              </template>
            </product-config>
          </div>
        </div>

        <aside class="col-span-2 self-start sticky top-20" v-if="items?.length">
          <!-- Summary -->
          <div
            class="basket-summary bg-primary-content text-base-content border border-base-300 rounded-xl px-4 text-center"
          >
            <div>
              <h2 class="mt-6 text-base-content">
                <span class="text-primary">{{ items.length }}</span> Product{{
                  items.length > 1 ? "s" : ""
                }}
              </h2>
            </div>

            <div class="totals">
              <!-- Promotions -->
              <div v-if="meta.hasPromotions">
                <div class="divider mt-4 uppercase text-xs">Discount</div>
                <h2 class="text-primary mt-0">{{ summary?.discount }}</h2>
              </div>

              <!-- Subtotal -->
              <div>
                <div class="divider mt-4 uppercase text-xs">SubTotal</div>
                <h2 class="text-primary mt-0">{{ summary.subtotal }}</h2>
              </div>

              <!-- Taxes -->
              <div v-if="meta.hasTaxes">
                <div class="divider mt-4 uppercase text-xs">Taxes</div>
                <h2 class="text-primary mt-0">{{ summary.taxes }}</h2>
              </div>

              <!-- Total -->
              <div>
                <div class="divider mt-4 uppercase">Total</div>
                <h1 class="text-primary text-3xl">
                  {{ summary?.total }}
                </h1>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions p-4">
            <button
              class="btn btn-block btn-primary mb-2"
              v-if="meta.canProcess"
              :disabled="meta.isProcessing"
              @click.prevent="updateBasket"
            >
              Update basket
            </button>

            <button
              class="btn btn-link btn-block btn-xs"
              type="reset"
              :disabled="meta.isProcessing"
              @click.prevent="clearBasket"
            >
              Clear Basket
            </button>
          </div>

          <!-- Promotions -->
          <div class="promotions px-4">
            <h4 class="divider">Discounts</h4>

            <form class="join mt-2">
              <fieldset class="form-control">
                <input
                  type="text"
                  id="code"
                  placeholder="Discount Code?"
                  v-model="modelPromotions.code"
                  class="input input-accent input-bordered w-full max-w-xs join-item"
                />
                <label class="label sr-only" for="code">
                  <span class="label-text">Discount Code</span>
                </label>
              </fieldset>

              <div class="actions">
                <button
                  class="btn btn-accent join-item"
                  type="reset"
                  :disabled="meta.isProcessing"
                  @click.prevent="
                    !modelPromotions.code?.length
                      ? null
                      : addPromotion(modelPromotions)
                  "
                >
                  Apply
                </button>
              </div>
            </form>

            <ul class="my-4 p-0 list-none">
              <li
                class="border flex items-center rounded-lg p-2"
                :class="{ 'border-accent': !meta.isProcessing }"
                v-for="promotion in promotions"
                :key="promotion.promotion.code"
              >
                <!-- <ReceiptPercentIcon class="w-6 h-6" /> -->

                <span class="spacer flex-1 mx-2">
                  {{ promotion.promotion.code }}
                </span>

                <strong
                  class="bg-base-300 rounded-lg flex items-center py-1 px-2 mx-1"
                  v-if="promotion?.promotion?.amount_formatted"
                >
                  {{ promotion.promotion.amount_formatted }}
                </strong>

                <button
                  class="btn btn-square btn-ghost btn-sm"
                  title="Click to Remove Discount"
                  @click.prevent="removePromotion(promotion)"
                  :disabled="meta.isProcessing"
                >
                  <x-mark-icon class="w-5 h-5" />
                </button>
              </li>
            </ul>
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
      <debug
        :debugging="debugging"
        title="Basket"
        :state="state"
        :model="{ model, promotions: modelPromotions }"
        :context="{ promotions, items, basket }"
        :errors="errors"
        :meta="meta"
        class=""
      ></debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBasket } from "..";
import CurrencySwitcher from "../components/CurrencySwitcher.vue";
import ProductConfig from "@/modules/product/views/ProductConfig.vue";
import Debug from "@/components/Debug.vue";
import { SquaresPlusIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const {
  state,
  basket,
  summary,
  errors,
  meta,
  items,
  promotions,
  currency,
  currencies,
  // ---
  updateBasket,
  updateCurrency,
  clearBasket,
  updateItem,
  addProduct,
  removeItem,
  updateTerm,
  updateQuantity,
  updateAttributes,
  updateOptions,
  updateProvisioning,
  addPromotion,
  removePromotion
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
  product_id: null,
  quantity: 1
});

const modelPromotions = ref({
  code: null
});
</script>
