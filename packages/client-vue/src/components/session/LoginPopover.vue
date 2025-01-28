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
          <Session no-header no-tabs model-value="login" color="secondary" />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external

// --- components
import Session from "./Session.vue";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@upmind-automation/upmind-ui";
</script>
