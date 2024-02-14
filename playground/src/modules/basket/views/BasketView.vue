<template>
  <section class="basket w-full">
    <div class="actions flex flex-none justify-end relative z-20 gap-2">
      <!-- Currency -->
      <upm-currency
        v-if="actors?.currency"
        :actor="actors.currency"
      ></upm-currency>

      <slot name="actions">
        <form @submit.prevent="addProduct(model)" class="join">
          <fieldset>
            <select
              class="select select-sm select-bordered w-24 md:w-auto join-item"
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

          <button
            class="btn btn-sm btn-primary join-item"
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
        </form>

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
    <header
      class="bg-base-100 text-base-content shadow-md rounded-box sticky top-0 z-10"
    >
      <div class="navbar relative z-20 pl-4">
        <h2 class="flex-1 title m-0 flex gap-1 justify-center">
          Basket

          <span v-if="meta.isLoading">is Loading</span>

          <span v-if="meta.isProcessing">is Updating</span>

          <span
            v-if="meta.isLoading || meta.isProcessing"
            class="loading loading-dots text-primary mx-2"
          ></span>

          <template v-if="!meta.isLoading && !meta.isProcessing">
            <span v-if="meta.isComplete">
              is <span class="text-primary">Now an Order</span>
            </span>

            <span v-else-if="meta.isCheckout">
              is <span class="text-primary">Checking out</span>
            </span>

            <span v-else-if="!meta.isAvailable">
              is <span class="text-primary">Empty</span>
            </span>

            <span v-else-if="meta.needsUpdating">
              needs <span class="text-primary">Updating</span>
            </span>

            <span v-else-if="!meta.isReadyForCheckout">
              is <span class="text-warning">NOT</span> Ready for Checkout
            </span>

            <span v-else>
              is <span class="text-primary">Ready for Checkout</span>
            </span>
          </template>
        </h2>
      </div>

      <!-- breadcrumbs -->
      <div
        class="steps steps-horizontal w-full my-4 text-xs"
        v-if="meta.isAvailable && !meta.isLoading"
      >
        <router-link
          class="step m-0 p-0 text-inherit no-underline uppercase"
          :class="meta.hasProducts ? 'step-primary' : 'step-warning'"
          :data-content="meta.hasProducts ? '✓' : '!'"
          :to="{ hash: '#items' }"
        >
          Basket Items
        </router-link>

        <router-link
          class="step m-0 p-0 text-inherit no-underline uppercase"
          :class="meta.hasFields ? 'step-primary' : 'step-warning'"
          :data-content="meta.hasFields ? '✓' : '!'"
          :to="{ hash: '#fields' }"
        >
          Order Fields
        </router-link>

        <router-link
          class="step m-0 p-0 text-inherit no-underline uppercase"
          :class="!meta.needsAuth ? 'step-primary' : 'step-warning'"
          :data-content="!meta.needsAuth ? '✓' : '!'"
          :to="{ hash: '#account' }"
        >
          Account
        </router-link>

        <router-link
          class="step m-0 p-0 text-inherit no-underline uppercase"
          :class="meta.hasBillingDetails ? 'step-primary' : 'step-warning'"
          :data-content="meta.hasBillingDetails ? '✓' : '!'"
          :to="{ hash: '#billing' }"
        >
          Billing Details
        </router-link>

        <router-link
          class="step m-0 p-0 text-inherit no-underline uppercase"
          :class="meta.hasPaymentDetails ? 'step-primary' : 'step-warning'"
          :data-content="meta.hasPaymentDetails ? '✓' : '!'"
          :to="{ hash: '#payment' }"
        >
          Payment
        </router-link>

        <button
          :disabled="!meta.isReadyForCheckout || meta.isProcessing"
          @click.prevent="checkout"
          class="btn uppercase btn-primary btn-sm h-full mr-8"
          :class="meta.isReadyForCheckout ? 'step-primary' : ''"
          :data-content="meta.isReadyForCheckout ? '✓' : ''"
        >
          Place order
        </button>
      </div>
    </header>

    <div
      class="basket grid grid-cols-7 gap-8 my-4 p-4 rounded-box items-start"
      v-if="!meta.isLoading && meta.isAvailable"
      :data-theme="activeTheme"
    >
      <!-- items -->
      <section
        id="items"
        class="items col-span-5 order-0 grid grid-cols-card gap-4 items-start"
      >
        <h3
          class="col-span-full text-inherit uppercase text-xl mt-2 mb-0 opacity-50"
        >
          Basket Items
        </h3>

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

      <!-- fields -->
      <section
        id="fields"
        class="fields col-span-5 order-2"
        :class="{ disabled: meta.needsAuth }"
        :disabled="meta.needsAuth"
        v-if="actors?.customFields"
      >
        <upm-basket-fields :actor="actors.customFields"></upm-basket-fields>
      </section>

      <!-- account -->
      <section id="account" class="account col-span-5 order-2">
        <upm-account :modelValue="meta.needsAuth"></upm-account>
      </section>

      <!-- billing -->
      <section
        id="billing"
        class="billing col-span-5 order-2"
        :class="{ disabled: meta.needsAuth }"
        :disabled="meta.needsAuth"
        v-if="!meta.needsAuth"
      >
        <upm-billing-details
          :actor="actors.billingDetails"
        ></upm-billing-details>
      </section>

      <!-- payment -->
      <section
        id="payment"
        class="payment col-span-5 order-2"
        :class="{ disabled: meta.needsAuth }"
        :disabled="meta.needsAuth"
      >
        <upm-payment-details
          :actor="actors.paymentDetails"
        ></upm-payment-details>
      </section>

      <!-- summary -->
      <aside
        id="summary"
        class="summary col-span-2 row-span-10 flex flex-col gap-8 order-1 self-start sticky top-32"
      >
        <!-- Promotions -->
        <upm-promotions
          v-if="actors?.promotions"
          :actor="actors.promotions"
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
          <!-- <div v-if="meta.hasPromotions">
            <div class="divider uppercase text-xs opacity-50">Discount</div>
            <h4 class="text-inherit mt-0">{{ summary?.discount }}</h4>
          </div> -->

          <!-- Subtotal -->
          <div>
            <div class="divider uppercase text-xs opacity-50">SubTotal</div>
            <h4 class="text-inherit mt-0">
              {{ summary?.subtotal }}
            </h4>
          </div>

          <!-- Taxes -->
          <div v-if="meta.hasTaxes">
            <div class="divider uppercase text-xs opacity-50">Taxes</div>
            <h4 class="text-inherit mt-0">{{ summary?.taxes }}</h4>
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
            v-if="meta.needsUpdating"
            :disabled="meta.isProcessing"
            @click.prevent="updateBasket"
          >
            Update basket
          </button>

          <button
            class="btn btn-lg btn-block btn-primary uppercase"
            :disabled="!meta.isReadyForCheckout || meta.isProcessing"
            @click.prevent="checkout"
          >
            Place order
          </button>

          <div class="flex flex-wrap justify-between">
            <router-link
              to="/"
              class="btn btn-outline btn-xs btn-primary border-none"
            >
              <arrow-uturn-left-icon class="w-5 h-5"></arrow-uturn-left-icon>
              Continue shopping
            </router-link>

            <button
              class="btn btn-outline btn-xs btn-primary border-none"
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
import { useBasket } from "@upmind/vue";
import UpmCurrency from "../components/Currency.vue";
import UpmProduct from "@/modules/product/views/Product.vue";
import UpmPromotions from "../components/Promotions.vue";
import UpmBillingDetails from "../components/BillingDetails.vue";
import UpmBasketFields from "../components/Fields.vue";
import UpmAccount from "../components/Account.vue";
import UpmPaymentDetails from "../components/PaymentDetails.vue";

import { UpmDebug } from "@upmind/ui";
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

  // ---
  addProduct,
  clearBasket,
  removeItem,
  updateAttributes,
  updateBasket,
  updateItem,
  updateOptions,
  updateProvisioning,
  updateQuantity,
  updateTerm,
  checkout,
  // ---
  actors
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

// make sure we update any basket fields if we navigate away from the basket
onBeforeUnmount(() => {
  // updateFields();
});
</script>
