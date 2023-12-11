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
          <hr />

          <div class="actions flex items-center justify-between gap-4">
            <div
              v-if="meta.hasPrimary"
              role="alert"
              class="alert border-primary indicator"
            >
              <check-circle-icon class="h-6 w-6 text-primary" />
              <span>
                <strong class="text-xl text-inherit text-primary">
                  {{ primaryDomain?.domain }}
                </strong>
                has been linked to your hosting.

                <strong
                  v-if="meta.hasAdditional"
                  class="indicator-item indicator-center indicator-bottom badge badge-ghost text-primary"
                >
                  +{{ values.length - 1 }} Additional Domains
                </strong>
              </span>
            </div>

            <span class="spacer"></span>

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
  ChevronRightIcon
} from "@heroicons/vue/24/outline";

import { capitalize } from "lodash-es";

const debugging = ref(true);
const activeTheme = ref("default");
const themes = import.meta.env.VITE_THEMES.split(",");
</script>
