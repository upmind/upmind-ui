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

// --- utils=
import { ringClasses, invalidRingClasses } from "../input/input.config";

defineOptions({
  name: "InputContainer",
});

const replaceClassNames = (
  classStrings: string[],
  replacements: Record<string, string>
): string[] => {
  return classStrings.flatMap(classes => {
    let updatedClasses = classes;
    Object.entries(replacements).forEach(([from, to]) => {
      const regex = new RegExp(`\\b${from}\\b`, "g");
      updatedClasses = updatedClasses.replace(regex, to);
    });
    return updatedClasses.split(" ");
  });
};

const containerClasses = computed(() =>
  replaceClassNames([ringClasses, invalidRingClasses], { visible: "within" })
);
</script>
