<template>
  <section class="dac w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 px-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Dac Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
          <select
            class="select select-primary select-bordered w-24 md:w-auto join-item"
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
          <span role="button" class="btn btn-square btn-primary join-item">
            <swatch-icon class="h-6 w-6" />
          </span>

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
      class="hero min-h-full py-44 bg-base-200 rounded-box my-4 relative z-10"
      :data-theme="activeTheme"
    >
      <div class="hero-content w-full">
        <div class="max-w-xl w-full">
          <h1 class="text-5xl font-bold text-primary">
            Choose <template v-if="multiple">Domain(s)</template
            ><template v-else>a Domain</template>&hellip;
          </h1>

          <upm-dac
            class="min-w-[20rem] max-w-4xl"
            v-model="model"
            :multiple="multiple"
            placeholder="Find your pefect domain &hellip;"
          />
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
import { UpmDac, UpmDebug } from "@upmind/components";
import { capitalize } from "lodash-es";
import { SwatchIcon } from "@heroicons/vue/24/outline";

const multiple = ref(true);

// const model = ref(["pewpew.com", "pewpew.net"]);
// const model = multiple.value ? ref(["pewpew.com", "pewpew.net"]) : "pewpew.com";
const model = ref(multiple.value ? [] : "");
const activeTheme = ref("default");
const themes = import.meta.env.VITE_THEMES.split(",");
</script>
