<template>
  <div
    class="bg-primary flex flex-col items-center justify-center space-y-6 py-8 text-xs text-white"
  >
    <img class="m-0 h-5" src="../../assets/logo-white.svg" alt="logo" />

    <div class="leading-none">Copyright © 2024 velia.net</div>

    <div class="flex items-center leading-none">
      <span v-for="(item, index) in links" :key="index">
        <span class="cursor-pointer hover:underline">{{ item }}</span>
        <span v-if="index < links.length - 1" class="mx-2">-</span>
      </span>
    </div>

    <div class="flex items-center space-x-4">
      <a href="https://www.facebook.com" target="_blank">
        <img
          class="my-0 h-4"
          src="../../assets/icons/facebook.svg"
          alt="facebook"
        />
      </a>
      <a href="https://www.x.com" target="_blank">
        <img class="my-0 h-4" src="../../assets/icons/x.svg" alt="x" />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const links = ref(["Imprint", "Terms of Service", "Data Protection"]);

    return {
      links,
    };
  },
});
</script>
