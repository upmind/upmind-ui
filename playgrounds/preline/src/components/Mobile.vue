<template>
  <figure :data-theme="activeTheme" class="mx-auto max-w-full w-[375px] h-auto">
    <div
      class="p-1.5 bg-gray-800 rounded-3xl shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(45_55_75_/_20%),_0_2rem_4rem_-2rem_rgb(45_55_75_/_30%),_inset_0_-0.1875rem_0.3125rem_0_rgb(45_55_75_/_20%)] dark:bg-gray-600 dark:shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(0_0_0_/_20%),_0_2rem_4rem_-2rem_rgb(0_0_0_/_30%),_inset_0_-0.1875rem_0.3125rem_0_rgb(0_0_0_/_20%)]"
    >
      <div
        class="bg-base text-base-content max-w-full rounded-[1.25rem] overflow-auto h-[667px]"
      >
        <router-view class="view" />
      </div>
    </div>
  </figure>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterView } from "vue-router";

export default defineComponent({
  name: "UpmMobile",
  inject: ["activeTheme"],
  components: {
    RouterView,
  },
});
</script>
