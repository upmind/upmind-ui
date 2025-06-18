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
          styles.loading.root,
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
// --- external
import { computed } from "vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./loading.config";

// --- components
import Spinner from "../spinner/Spinner.ce.vue";

// --- types
import type { ComputedRef } from "vue";
import type { LoadingProps } from "./types";

const slots = defineSlots<{
  default(): void;
}>();
const hasSlotContent = computed(() => !!slots.default);

const props = withDefaults(defineProps<LoadingProps>(), {
  active: true,
  size: "lg",
  skrim: "light",
});

const meta = computed(() => ({
  skrim: props.skrim,
}));

const styles = useStyles("loading", meta, config) as ComputedRef<{
  loading: {
    root: string;
  };
}>;
</script>
