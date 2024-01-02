<template>
  <section class="forms w-full relative">
    <header class="navbar absolute left-0 right-0 top-0 z-10 pl-4 rounded-xl">
      <div class="flex-1"></div>

      <div class="actions flex-none join"></div>
    </header>

    <div :data-theme="activeTheme" class="p-8 rounded-box">
      <div class="gap-4 items-center text-center">
        <h3 class="text-base-content flex-none m-0">Web Hosting</h3>
        <ul class="steps w-full flex-1">
          <li :data-content="parent ? '✓' : '?'" class="step step-primary">
            Choose a plan
          </li>
          <li
            class="step"
            :data-content="
              !!parent?.state?.value?.context?.values?.provision_fields?.domain
                ? '✓'
                : '+'
            "
            :class="
              !!parent?.state?.value?.context?.values?.provision_fields?.domain
                ? 'step-primary'
                : ''
            "
          >
            Add a domain
          </li>
        </ul>
      </div>

      <div v-if="!availableParents?.length" class="my-8">
        <h4 class="text-base-content text-center">
          Select from one of our Plans
        </h4>

        <div class="stats w-full bg-base-300">
          <div
            class="stat place-items-center"
            v-for="product in products"
            :key="product.value"
          >
            <div class="stat-title text-inherit">{{ product.label }}</div>
            <div class="stat-desc text-inherit">{{ product.prefix }}</div>
            <div class="stat-value" :class="`text-${product.variant}`">
              {{ product.price }}
            </div>
            <div class="stat-desc text-inherit">{{ product.suffix }}</div>
            <div class="stat-actions">
              <button
                class="btn btn-sm"
                :class="`btn-${product.variant}`"
                @click="add(product.value)"
              >
                Add to basket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="availableParents.length && !parent"
        class="flex flex-col gap-8 items-center my-8 justify-center"
      >
        <h4 class="text-base-content m-0">Select from your basket</h4>

        <div class="join">
          <input
            v-for="product in availableParents"
            @input="select(product.state.value.context.values.product_id)"
            :key="product.id"
            class="join-item btn btn-primary"
            type="radio"
            name="product"
            :aria-label="`${
              product.state.value.context.available.product.name
            } (${
              product.state.value.context.values?.provision_fields?.domain ||
              'No Domain'
            })`"
            :value="product.state.value.context.values.product_id"
          />
        </div>
      </div>

      <!--  -->
      <upm-domain sync-basket :debugging="debugging" :parent="parent" v-else>
        <template #actions="{ meta, primaryDomain, values }">
          <div
            class="actions flex items-center justify-between gap-4 w-100 rounded-box px-4 mt-12 border min-h-[5rem]"
            :class="
              meta.isSyncing || !meta.hasValues
                ? 'bg-gray-200 border-gray-200 text-gray-400'
                : 'bg-primary-content border-primary text-base-content '
            "
          >
            <div
              class="flex p-4 gap-4 bg-transparent border-none indicator flex-grow justify-center"
            >
              <template v-if="meta.isSyncing">
                <span class="loading loading-dots loading-xs opacity-50"></span>
              </template>

              <template v-else-if="!meta.hasValues">
                <exclamation-triangle-icon class="h-10 w-10" />

                <span class="">No domain has been linked to your hosting.</span>
              </template>

              <template v-else>
                <check-circle-icon class="h-10 w-10 text-primary" />

                <strong class="text-xl text-inherit text-primary">
                  {{ primaryDomain?.domain }}
                </strong>

                has been linked to your hosting.

                <strong
                  v-if="meta.hasAdditional"
                  class="indicator-item indicator-center indicator-bottom badge badge-primary"
                >
                  +{{ values.length - 1 }} Additional Domains
                </strong>
              </template>
            </div>

            <router-link
              v-if="meta.showContinue"
              to="/basket"
              class="btn btn-primary"
            >
              Continue to checkout
              <chevron-right-icon class="h-6 w-6" />
            </router-link>
          </div>
        </template>
      </upm-domain>
    </div>

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref } from "vue";

import { UpmDomain } from "@upmind/components";
import { useBasket } from "../../basket";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/vue/24/outline";

import { filter, map, includes, first, find } from "lodash-es";

// ---------------------------------------------------------------------------
const { items, addProduct } = useBasket();

// ---------------------------------------------------------------------------
const debugging = ref(true);
const activeTheme = inject("activeTheme");

// ---------------------------------------------------------------------------
const products = [
  {
    label: "Starter Hosting",
    value: "5d085e69-d562-3719-7d6f-218e940d4237",
    price: "$5",
    prefix: "starting from",
    suffix: "per month",
    variant: "primary"
  },
  {
    label: "Advanced Hosting",
    value: "4d036794-24d0-e710-965b-3153698d582e",
    price: "$10",
    prefix: "starting from",
    suffix: "per month",
    variant: "primary"
  }
];

const validProducts = computed(() => map(products, "value"));

const availableParents = computed(() => {
  return filter(items.value, item => {
    const found = includes(
      validProducts.value,
      item.state.value.context.values.product_id
    );
    return found;
  });
});

const selected = ref(
  availableParents.value?.length == 1
    ? first(availableParents.value)?.state.value.context.values.product_id
    : null
);

const parent = computed(() => {
  return find(items.value, [
    "state.value.context.values.product_id",
    selected.value
  ]);
});

// ---
function select(product: String) {
  selected.value = product;
}

function add(product: String) {
  select(product);
  addProduct({ product_id: product, quantity: 1 });
}
</script>
