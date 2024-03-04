<template>
  <div class="grid grid-cols-6 gap-4 min-h-screen" :data-theme="activeTheme">
    <header class="flex flex-col items-center justify-start">
      <div class="avatar my-4">
        <div class="w-28 h-28">
          <logo-icon class="w-full h-full"></logo-icon>
        </div>
      </div>

      <!-- <label for="my-drawer-2" class="btn btn-square drawer-button lg:hidden">
        <Bars4Icon></Bars4Icon>
      </label> -->

      <pv-menu :model="routes" class="sticky top-0 w-full">
        <template #start>
          <pv-input-group class="p-2">
            <pv-input-group-addon>
              <i class="pi pi-palette"></i>
            </pv-input-group-addon>
            <pv-dropdown
              v-model="activeTheme"
              :options="themes"
              placeholder="Select a Theme"
            >
              <template #option="{ option }">{{ startCase(option) }}</template>
              <template #value="{ value }">{{ startCase(value) }}</template>
            </pv-dropdown>
          </pv-input-group>
        </template>
        <template #item="{ item, props }">
          <router-link v-slot="{ href, navigate }" :to="item.path" custom>
            <a v-ripple :href="href" v-bind="props.action" @click="navigate">
              <span :class="item.icon" v-if="item?.icon" />
              <span>{{ startCase(item.name) }}</span>
            </a>
          </router-link>
        </template>
      </pv-menu>
    </header>

    <main class="prose max-w-none col-span-5 p-4">
      <upm-feedback :data-theme="activeTheme" />
      <router-view class="view" />
    </main>
  </div>
</template>

<script setup lang="ts">
// --- external
import { provide, ref, watch } from "vue";
import { RouterView, useRouter } from "vue-router";

// --- components
import PvDropdown from "primevue/dropdown";
import PvMenu from "primevue/menu";
import PvInputGroup from "primevue/inputgroup";
import PvInputGroupAddon from "primevue/inputgroupaddon";

// --- internal
import LogoIcon from "@/assets/logo.svg";
import UpmFeedback from "@/modules/feedback/components/Feedback.vue";

// --- utils
import { startCase } from "lodash-es";

// ---
const router = useRouter();
const routes = ref(router.options.routes);

// ---
import { usePrimeVue } from "primevue/config";
const PrimeVue = usePrimeVue();

const activeTheme = ref("mdc-light-indigo");
const themes = import.meta.env.VITE_THEMES.split(",");

watch(
  () => activeTheme.value,
  (theme, current) => {
    debugger;
    PrimeVue.changeTheme(current, theme, "theme-link", () => {});
  }
);

provide("activeTheme", activeTheme);
</script>
