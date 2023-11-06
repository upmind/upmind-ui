<template>
  <div id="app" data-theme="light" class="grid grid-cols-5 gap-4">
    <header class="flex flex-col items-center justify-start bg-gray-100">
      <img
        alt="Vue logo"
        class="logo my-8"
        src="@/assets/logo.svg"
        width="125"
        height="125"
      />
      <div class="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />

        <div class="drawer-content flex flex-col items-center justify-center">
          <!-- Page content here -->
          <label
            for="my-drawer-2"
            class="btn btn-square drawer-button lg:hidden"
          >
            <Bars4Icon></Bars4Icon>
          </label>
        </div>

        <nav class="drawer-side">
          <!-- <label
            for="my-drawer-2"
            aria-label="close sidebar"
            class="drawer-overlay"
          ></label> -->
          <ul
            class="menu sticky top-0 bg-gray-100 top-0 p-4 w-60 max-w-full text-base-content"
          >
            <!-- Sidebar content here -->
            <li v-for="route in routes" :key="route.path">
              <router-link :to="route.path">
                {{ upperFirst(route.name) }}
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="prose max-w-none col-span-4 p-4">
      <router-view class="view" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { upperFirst } from "lodash-es";

import { Bars4Icon } from "@heroicons/vue/24/solid";

const router = useRouter();
const routes = ref(router.options.routes);
</script>
