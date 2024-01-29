<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1 flex gap-4 justify-between">
        <h2 class="title m-0">My Companies</h2>
        <span class="badge badge-primary" v-if="selectedId">{{
          selectedId
        }}</span>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div :data-theme="activeTheme" class="bg-base-200 rounded-box my-8 p-4">
      <upm-companies class="" @update:model-value="selectedId = $event" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";

import UpmCompanies from "../components/Companies.vue";

const activeTheme = inject("activeTheme");

const selectedId = ref(null);
</script>
