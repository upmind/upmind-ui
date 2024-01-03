<template>
  <section class="forms w-full relative">
    <header class="navbar absolute left-0 right-0 top-0 z-10 pl-4 rounded-xl">
      <div class="flex-1"></div>

      <div class="actions flex-none join"></div>
    </header>

    <div :data-theme="activeTheme" class="p-8 rounded-box">
      <div class="gap-4 items-center text-center">
        <h1 class="text-base-content m-0">Web Hosting</h1>
        <h3 class="text-base-content">Get your website online today!</h3>
        <p>
          All annual packages include a free 1 year domain name, WordPress
          support, email service, fast SSD servers, 24/7 support and more
        </p>

        <div class="flex-1" v-if="meta.isLoading || meta.isProcessing">
          <progress class="progress progress-primary w-1/2"></progress>
        </div>

        <ul v-else class="steps w-full flex-1">
          <li :data-content="parent ? '✓' : '1'" class="step step-primary">
            Choose a plan
          </li>
          <li
            class="step"
            :data-content="
              !!parent?.state?.value?.context?.values?.provision_fields?.domain
                ? '✓'
                : '2'
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

      <template v-if="!meta.isLoading">
        <div v-if="!availableParents?.length || forceNew" class="my-8">
          <h4 class="text-base-content text-center">
            Select one of our Web Hosting Plans
          </h4>

          <div class="stats w-full bg-base-200">
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
          v-else-if="availableParents.length && !parent && !forceNew"
          class="flex flex-col gap-8 items-center my-8 justify-center"
        >
          <h4 class="text-base-content m-0">Choose from your basket</h4>

          <div class="join join-vertical">
            <input
              v-for="product in availableParents"
              @input="select(product.id)"
              :key="product.id"
              class="join-item btn btn-primary btn-outline"
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
            <button
              @click="forceNew = true"
              class="join-item btn btn-primary"
              name="product"
            >
              <plus-circle-icon class="h-6 w-6" />

              Add Another Plan
            </button>
          </div>
        </div>

        <!--  -->
        <upm-domain sync-basket :debugging="debugging" :parent="parent" v-else>
          <template #header="{ meta }">
            <h1 class="text-5xl font-bold text-primary">
              <template v-if="!meta.hasPrimary"
                >Choose a domain&hellip;</template
              >
              <template v-else>
                Congrats!
                <span class="text-2xl font-bold text-primary m-0">
                  You have selected your domain&hellip;
                </span></template
              >
            </h1>

            <p>
              Thank you for choosing our hosting! We include a free 1 year .com,
              .org, or .net domain name*. <br />
              <small> The discount will be applied at checkout. </small>
            </p>
          </template>

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
                class="flex p-4 gap-4 bg-transparent border-none indicator flex-grow justify-center items-center"
              >
                <template v-if="meta.isSyncing">
                  <span
                    class="loading loading-dots loading-xs opacity-50"
                  ></span>
                </template>

                <template v-else-if="!meta.hasValues">
                  <exclamation-triangle-icon class="h-10 w-10" />

                  <span class=""
                    >No domain has been linked to your hosting.</span
                  >
                </template>

                <template v-else>
                  <check-circle-icon class="h-10 w-10 text-primary" />

                  <strong class="text-xl text-inherit text-primary">
                    {{ primaryDomain?.domain }}
                  </strong>

                  has been linked to your hosting.
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
      </template>
    </div>

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";

import { UpmDomain } from "@upmind/components";
import { useBasket } from "../../basket";

import {
  PlusCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/vue/24/outline";

import { filter, map, includes, first, find, uniqueId } from "lodash-es";

// ---------------------------------------------------------------------------
const { items, addProduct, meta } = useBasket();

// ---------------------------------------------------------------------------
const debugging = ref(true);
const activeTheme = inject("activeTheme");
const selected = ref();
const forceNew = ref(false);

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

const parent = computed(() => {
  return !!selected.value && find(items.value, ["id", selected.value]);
});

// ---
function select(machineId: String) {
  selected.value = machineId;
  forceNew.value = false;
}

function add(product: String) {
  const machineId = uniqueId("web_hosting_");
  addProduct({ id: machineId, product_id: product, quantity: 1 });
  select(machineId);
}

// auto select if only one product is available
watch(availableParents, value => {
  if (value.length == 1) {
    const product = first(value);
    select(product.id);
  }
});
</script>
