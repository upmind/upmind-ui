<template>
  <section class="forms w-full relative">
    <header class="navbar absolute left-0 right-0 top-0 z-10 pl-4 rounded-xl">
      <div class="flex-1"></div>

      <div class="actions flex-none join">
        <select
          class="select select-bordered w-24 md:w-auto join-item"
          v-model="activeTheme"
          placeholder="Select Theme"
        >
          <option
            v-for="(item, index) in themes"
            :key="`item-${index}`"
            :value="item"
            :label="capitalize(item)"
          ></option>
        </select>
        <span role="button" class="btn btn-square join-item">
          <swatch-icon class="h-6 w-6" />
        </span>
      </div>
    </header>

    <div :data-theme="activeTheme">
      <upm-domain sync-basket :debugging="debugging">
        <template #header="{ meta }">
          <h1 class="text-5xl font-bold text-primary">
            <template v-if="!meta.hasPrimary">Choose a domain&hellip;</template>
            <template v-else>
              Congrats!
              <span class="text-2xl font-bold text-primary m-0">
                You have selected your domain&hellip;
              </span></template
            >
          </h1>

          <p>
            Register, transfer or use your existing domains with us. We are here
            to help.
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
                <span class="loading loading-dots loading-xs opacity-50"></span>
              </template>

              <template v-else-if="!meta.hasValues">
                <exclamation-triangle-icon class="h-10 w-10" />

                <span class="">No domain has been added.</span>
              </template>

              <template v-else>
                <check-circle-icon class="h-10 w-10 text-primary" />

                <strong class="text-xl text-inherit text-primary">
                  {{ primaryDomain?.domain || values[0].domain }}
                </strong>

                has been added.

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
import { ref, inject } from "vue";

import { UpmDomain } from "@upmind/components";

import {
  SwatchIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/vue/24/outline";

import { capitalize } from "lodash-es";

const debugging = ref(true);
const activeTheme = inject("activeTheme");
</script>
