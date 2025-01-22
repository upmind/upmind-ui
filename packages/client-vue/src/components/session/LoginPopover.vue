<template>
  <Popover>
    <PopoverTrigger>
      <slot />
    </PopoverTrigger>
    <PopoverContent
      class="relative z-30 mt-4 h-screen w-auto border-0 border-t p-0 md:mt-8 md:h-auto md:border"
      align="end"
    >
      <div class="flex h-full flex-col md:flex-row">
        <div class="w-screen p-8 md:w-[26rem]">
          <UpmSession no-header no-tabs :show="show" color="secondary" />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";

// --- components
import UpmSession from "./Session.vue";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@upmind-automation/upwind";

const show = ref("login");
</script>
