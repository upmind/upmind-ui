<template>
  <section class="basket w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
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

    <div
      class="basket grid grid-cols-7 gap-8 my-4 p-4 rounded-box items-start"
      v-if="!meta.isLoading && meta.hasProducts"
      :data-theme="activeTheme"
    >
      <!-- <ul class="steps">
        <li class="step step-primary" data-content="?">Configure</li>
        <li class="step" data-content="★">Auth</li>
        <li class="step" data-content="$">Checkout</li>
        <li class="step" data-content="✓">Complete</li>
      </ul> -->

      <section
        class="items col-span-5 order-0 grid grid-cols-2 gap-4 items-start"
      >
        <div class="col-span-2 divider uppercase text-xs opacity-50">
          Basket Items
        </div>

        <upm-product
          v-for="item in items"
          :key="item.id"
          :item="item"
          :id="item.id"
          :processing="meta.isProcessing"
          @remove="removeItem"
          @update:term="updateTerm"
          @update:quantity="updateQuantity"
          @update:attributes="updateAttributes"
          @update:options="updateOptions"
          @update:provisioning="updateProvisioning"
          :debugging="debugging"
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
        </upm-product>
      </section>

      <section class="account col-span-5 order-2" v-if="meta.needsAuth">
        <div class="divider uppercase text-xs opacity-50">Account</div>

        <upm-auth class="my-8 p-0"></upm-auth>
      </section>

      <section class="billing col-span-5 order-2" v-if="!meta.needsAuth">
        <div class="divider uppercase text-xs opacity-50">Billing Details</div>
      </section>

      <section
        class="fields col-span-5 order-2"
        v-if="meta.hasFields && !meta.needsAuth"
      >
        <div class="divider uppercase text-xs opacity-50">Order fields</div>

        <upm-basket-fields
          :schema="fieldsSchema"
          :uischema="fieldsUischema"
          :model-value="fieldsModel"
          :processing="meta.isProcessing"
          :additionalErrors="errors?.data"
          @resolve="updateFields"
          @update:modelValue="setFields"
          @reject="clearFields"
        ></upm-basket-fields>
      </section>

      <aside
        class="summary col-span-2 row-span-4 flex flex-col gap-8 order-1 self-start sticky top-20"
      >
        <!-- Promotions -->
        <upm-promotions
          :promotions="promotions"
          :processing="meta.isProcessing"
          :additionalErrors="errors?.data"
          @resolve="addPromotion"
          @reject="removePromotion"
        ></upm-promotions>

        <!-- Summary -->
        <div
          class="basket-summary flex flex-col bg-primary-content text-primary border border-base-300 rounded-box px-4 text-center"
        >
          <h3 class="text-inherit text-xl">Order Summary</h3>
          <!-- Items -->
          <div>
            <div class="divider uppercase text-xs opacity-50">
              Product{{ items.length > 1 ? "s" : "" }}
            </div>

            <h4 class="text-inherit mt-0">{{ items.length }}</h4>
          </div>

          <!-- Promotions -->
          <div v-if="meta.hasPromotions">
            <div class="divider uppercase text-xs opacity-50">Discount</div>
            <h4 class="text-inherit mt-0">{{ summary?.discount }}</h4>
          </div>

          <!-- Subtotal -->
          <div>
            <div class="divider uppercase text-xs opacity-50">SubTotal</div>
            <h4 class="text-inherit mt-0">
              {{ summary.subtotal }}
            </h4>
          </div>

          <!-- Taxes -->
          <div v-if="meta.hasTaxes">
            <div class="divider uppercase text-xs opacity-50">Taxes</div>
            <h4 class="text-inherit mt-0">{{ summary.taxes }}</h4>
          </div>

          <!-- Total -->
          <div>
            <div class="divider text-xs uppercase opacity-50">Total</div>
            <h3 class="text-inherit mt-0 text-3xl">
              {{ summary?.total }}
            </h3>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions flex flex-col gap-8 relative">
          <button
            class="btn btn-block btn-primary btn-outline"
            v-if="meta.canProcess"
            :disabled="meta.isProcessing"
            @click.prevent="updateBasket"
          >
            Update basket
          </button>

          <button
            class="btn btn-lg btn-block btn-primary"
            :disabled="!meta.isReadyForCheckout || meta.isProcessing"
          >
            Place order and pay
          </button>

          <div class="flex flex-wrap justify-between">
            <router-link to="/" class="btn btn-link btn-xs">
              <arrow-uturn-left-icon class="w-5 h-5"></arrow-uturn-left-icon>
              Continue shopping
            </router-link>

            <button
              class="btn btn-link btn-xs"
              type="reset"
              :disabled="meta.isProcessing"
              @click.prevent="clearBasket"
            >
              <trash-icon class="w-5 h-5"></trash-icon> Clear Basket
            </button>
          </div>
        </div>
      </aside>
    </div>

    <footer>
      <upm-debug
        :debugging="debugging"
        title="Basket"
        :state="state"
        :model="{ model }"
        :context="{ promotions, items, basket }"
        :errors="errors"
        :meta="meta"
        class=""
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onBeforeUnmount } from "vue";
import { useBasket } from "..";
import CurrencySwitcher from "../components/CurrencySwitcher.vue";
import UpmProduct from "@/modules/product/views/Product.vue";
import UpmPromotions from "../components/Promotions.vue";
import UpmBasketFields from "../components/Fields.vue";
import UpmAuth from "../../session/components/Auth.vue";

import { UpmDebug } from "@upmind/components";
import {
  SquaresPlusIcon,
  ArrowUturnLeftIcon,
  TrashIcon
} from "@heroicons/vue/24/outline";

const activeTheme = inject("activeTheme");

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
  fieldsModel,
  fieldsSchema,
  fieldsUischema,
  // ---
  addProduct,
  addPromotion,
  clearBasket,
  clearErrors,
  removeItem,
  removePromotion,
  updateAttributes,
  updateBasket,
  updateCurrency,
  updateItem,
  updateOptions,
  updateProvisioning,
  updateQuantity,
  updateTerm,
  clearFields,
  setFields,
  updateFields
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

const debugging = ref(false);

const model = ref({
  product_id: null,
  quantity: 1
});

// make sure we update any basket fields if we navigate away from the basket
onBeforeUnmount(() => {
  updateFields();
});
</script>
