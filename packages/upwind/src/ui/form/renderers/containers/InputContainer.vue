<template>
  <div class="group w-full" :class="containerClasses">
    <slot />

    <!-- Avoid purge -->
    <span
      class="ring-invalid hidden ring-2 ring-ring ring-offset-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    ></span>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- utils
import { replaceClassNames } from "../utils";
import { ringClasses, invalidRingClasses } from "../../../input/input.config";

defineOptions({
  name: "InputContainer",
});

const containerClasses = computed(() =>
  replaceClassNames([ringClasses, invalidRingClasses], { visible: "within" })
);
</script>
