<template>
  <section class="forms w-full relative">
    <header class="navbar absolute left-0 right-0 top-0 z-10 pl-4 rounded-xl">
      <div class="flex-1"></div>

      <div class="actions flex-none join"></div>
    </header>

    <div :data-theme="activeTheme">
      <template v-if="!availableParents?.length">
        <h3>Web Hosting</h3>
        <div class="stats shadow w-full">
          <div
            class="stat place-items-center bg-opacity-10"
            :class="`bg-${product.variant}`"
            v-for="product in parentProducts"
            :key="product.value"
          >
            <div class="stat-title">{{ product.label }}</div>
            <div class="stat-desc">{{ product.prefix }}</div>
            <div class="stat-value" :class="`text-${product.variant}`">
              {{ product.price }}
            </div>
            <div class="stat-desc">{{ product.suffix }}</div>
            <div class="stat-actions">
              <button
                class="btn btn-sm"
                :class="`btn-${product.variant}`"
                @click="addProduct({ product_id: product.value, quantity: 1 })"
              >
                Add to basket
              </button>
            </div>
          </div>
        </div>
      </template>
      <template></template>

      <!--  -->
      <upm-domain
        sync-basket
        :debugging="debugging"
        :parent="parent"
        v-if="parent"
      >
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

import { filter, map, includes, first } from "lodash-es";

// ---------------------------------------------------------------------------
const { items, addProduct } = useBasket();

// ---------------------------------------------------------------------------
const debugging = ref(true);
const activeTheme = inject("activeTheme");
// ---------------------------------------------------------------------------
const parentProducts = [
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
    variant: "secondary"
  }
];

const parentProductIds = computed(() => map(parentProducts, "value"));
const availableParents = computed(() => {
  return filter(items.value, item => {
    const found = includes(
      parentProductIds.value,
      item.state.value.context.values.product_id
    );
    return found;
  });
});

const parent = ref(
  availableParents.value?.length == 1 ? first(availableParents.value) : null
);
</script>
