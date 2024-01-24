<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0">My Places</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div
      :data-theme="activeTheme"
      class="bg-base-200 rounded-box my-8 max-w-screen-lg p-4"
    >
      <upm-places debugging />
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject } from "vue";

import UpmPlaces from "../components/Places.vue";

const activeTheme = inject("activeTheme");
</script>
