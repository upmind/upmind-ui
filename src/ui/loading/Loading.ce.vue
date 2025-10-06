<template>
  <component
    :is="is"
    class="relative w-full"
    :class="[props.class, active ? 'opacity-50' : '']"
  >
    <slot></slot>
    <Transition
      enter-active-class="transition-opacity duration-200 ease-in-out"
      leave-active-class="transition-opacity duration-200 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="active"
        class="opacity-100"
        :class="[
          styles.loading.root,
          !hasSlotContent ? 'fixed inset-0' : 'absolute inset-0',
          props.classActive
        ]"
      >
        <Spinner :size="size" />
      </div>
    </Transition>
  </component>
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
  is: "div"
});

const meta = computed(() => ({
  //
}));

const styles = useStyles("loading", meta, config) as ComputedRef<{
  loading: {
    root: string;
  };
}>;
</script>
