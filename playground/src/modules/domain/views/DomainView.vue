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
        <template #actions="{ meta, primaryDomain, values }">
          <div
            class="actions flex items-center justify-between gap-4 w-100 rounded-box px-4 mt-12 border min-h-[5rem]"
            :class="
              meta.isSyncing || !meta.hasValues
                ? 'bg-gray-200 border-gray-200 '
                : 'bg-primary-content border-primary '
            "
          >
            <div
              class="alert bg-transparent border-none indicator flex-grow justify-center"
            >
              <template v-if="meta.isSyncing">
                <span class="loading loading-dots loading-xs opacity-50"></span>
              </template>

              <template v-else-if="!meta.hasValues">
                <exclamation-triangle-icon class="h-10 w-10 text-gray-400" />

                <span class="text-gray-400"
                  >No domain has been linked to your hosting.</span
                >
              </template>

              <template v-else>
                <check-circle-icon class="h-10 w-10 text-primary" />
                <span>
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
                </span>
              </template>
            </div>

            <button class="btn btn btn-primary" :disabled="!meta.showContinue">
              Continue to checkout
              <chevron-right-icon class="h-6 w-6" />
            </button>
          </div>
        </template>
      </upm-domain>
    </div>

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { UpmDomain } from "@upmind/components";

import {
  SwatchIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/vue/24/outline";

import { capitalize } from "lodash-es";

const debugging = ref(true);
const activeTheme = ref("default");
const themes = import.meta.env.VITE_THEMES.split(",");
</script>
