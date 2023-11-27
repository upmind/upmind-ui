<template>
  <div data-theme="light" class="grid grid-cols-6 gap-4 min-h-screen">
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
        <!-- Sidebar content here -->
        <li v-for="route in routes" :key="route.path">
          <router-link :to="route.path" active-class="active">
            {{ upperFirst(route.name) }}
          </router-link>
        </li>
      </ul>
    </header>

    <main class="prose max-w-none col-span-5 p-4">
      <router-view class="view" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { upperFirst } from "lodash-es";
import LogoIcon from "@/assets/logo.svg";

const router = useRouter();
const routes = ref(router.options.routes);
</script>
