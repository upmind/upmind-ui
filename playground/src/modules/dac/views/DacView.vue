<template>
  <section class="dac w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Dac Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
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
          <!-- <div class="dropdown dropdown-end">
            <button tabindex="0" role="button" class="btn btn-primary">
              Select Theme
            </button>
            <ul
              class="dropdown-content menu w-56 items-end bg-base-100 flex-col flex-nowrap rounded-box z-10 shadow-sm min-h-[13em] max-h-[13em] overflow-y-auto"
            >
              <li v-for="theme in themes" :key="theme" class="w-full">
                <input
                  type="radio"
                  name="theme-dropdown"
                  class="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                  :aria-label="theme"
                  :value="theme"
                  v-model="activeTheme"
                />
              </li>
            </ul>
          </div> -->
        </slot>
      </div>
    </header>

    <div
      class="hero min-h-full py-32 bg-base-200 rounded-box my-4"
      :data-theme="activeTheme"
    >
      <div class="hero-content">
        <div class="max-w-xl">
          <h1 class="text-5xl font-bold text-primary">Choose a domain...</h1>
          <p class="py-6">
            Thank you for choosing our hosting! We include a free 1 year .com,
            .org, or .net domain name*. The discount will be applied at
            checkout.
          </p>
          <upm-dac
            class="my-8 min-w-[20rem] max-w-4xl mx-auto"
            v-model="model"
            placeholder="Find your pefect domain &hellip;"
          >
            <template #results="{ results, meta, isOpen, update }">
              <upm-dac-results-dropdown
                :results="results"
                :processing="meta.isProcessing"
                :open="isOpen"
                @change="update"
              />
            </template>
          </upm-dac>
        </div>
      </div>
    </div>

    <footer>
      <upm-debug
        title="Dac"
        :context="{ model }"
        :open="{ context: true }"
      ></upm-debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { UpmDac, UpmDacResultsDropdown, UpmDebug } from "@upmind/components";
import { capitalize } from "lodash-es";

const model = ref("");
const activeTheme = ref("default");
const themes = [
  "default",
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter"
];
</script>
