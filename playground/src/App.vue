<template>
  <div class="grid grid-cols-6 gap-4 min-h-screen">
    <header
      class="flex flex-col items-center justify-start bg-base-200 text-base-content"
    >
      <div class="avatar my-4">
        <div class="w-28 h-28">
          <logo-icon class="w-full h-full"></logo-icon>
        </div>
      </div>

      <!-- <label for="my-drawer-2" class="btn btn-square drawer-button lg:hidden">
        <Bars4Icon></Bars4Icon>
      </label> -->

      <ul class="menu max-w-xs w-full sticky top-0">
        <li>
          <span>
            <swatch-icon class="h-6 w-6" />
            <select
              class="select select-sm select-bordered w-full"
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
          </span>
        </li>

        <!-- Sidebar content here -->
        <li v-for="route in routes" :key="route.path">
          <router-link :to="route.path" active-class="active">
            {{ upperFirst(route.name) }}
          </router-link>
        </li>
      </ul>

      <!--  -->

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
    </header>

    <main class="prose max-w-none col-span-5 p-4">
      <router-view class="view" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { upperFirst } from "lodash-es";
import LogoIcon from "@/assets/logo.svg";
import { SwatchIcon } from "@heroicons/vue/24/outline";

import { capitalize } from "lodash-es";

const router = useRouter();
const routes = ref(router.options.routes);
const activeTheme = ref("default");
const themes = import.meta.env.VITE_THEMES.split(",");

provide("activeTheme", activeTheme);
</script>
