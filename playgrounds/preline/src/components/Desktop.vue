<template>
  <figure
    class="relative z-[1] max-w-full h-auto rounded-b-lg shadow-[0_2.75rem_3.5rem_-2rem_rgb(45_55_75_/_20%),_0_0_5rem_-2rem_rgb(45_55_75_/_15%)] dark:shadow-[0_2.75rem_3.5rem_-2rem_rgb(0_0_0_/_20%),_0_0_5rem_-2rem_rgb(0_0_0_/_15%)]"
  >
    <div
      class="relative flex gap-12 justify-start items-center bg-base-300 rounded-t-lg py-2 px-4 dark:bg-base-200"
    >
      <div class="flex gap-1">
        <span class="size-2 bg-error rounded-full"></span>
        <span class="size-2 bg-warning rounded-full"></span>
        <span class="size-2 bg-success rounded-full"></span>
      </div>

      <!-- <div
            class="flex-1 rounded-xl text-xs py-1 px-4 bg-base-100 text-base-content"
          >
            www.upmind.com
          </div> -->
    </div>

    <div
      :data-theme="activeTheme"
      class="bg-base-100 text-base-content rounded-b-lg max-w-7xl mx-auto min-h-screen"
    >
      <router-view class="view" />
    </div>
  </figure>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterView } from "vue-router";

export default defineComponent({
  name: "UpmDesktop",
  components: {
    RouterView,
  },
  inject: ["activeTheme"],
});
</script>
