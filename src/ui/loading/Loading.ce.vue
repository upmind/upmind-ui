<template>
  <div class="relative w-full">
    <slot></slot>
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="active"
        :class="[
          'z-50 flex items-center justify-center bg-white/75 text-secondary',
          !hasSlotContent ? 'fixed inset-0' : 'absolute inset-0',
          props.class,
        ]"
      >
        <Spinner :size="size" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useSlots, computed } from "vue";
import Spinner from "../spinner/Spinner.ce.vue";
import type { LoadingProps } from "./types";

const slots = defineSlots<{
  default(): void;
}>();
const hasSlotContent = computed(() => !!slots.default);

const props = withDefaults(defineProps<LoadingProps>(), {
  active: true,
  size: "lg",
});
</script>
