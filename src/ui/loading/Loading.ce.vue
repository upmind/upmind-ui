<template>
  <component :is="is" :class="styles.loading.root">
    <div :class="cn(styles.loading.content, props.class)">
      <slot></slot>
    </div>
    <Transition
      v-if="active"
      enter-active-class="transition-opacity duration-200 ease-in-out"
      leave-active-class="transition-opacity duration-200 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        :class="[
          styles.loading.spinner,
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
import type { LoadingProps } from "./types";

const slots = defineSlots<{
  default(): void;
}>();
const hasSlotContent = computed(() => !!slots.default);

const props = withDefaults(defineProps<LoadingProps>(), {
  active: true,
  transparent: true,
  size: "lg",
  is: "div"
});

const meta = computed(() => ({
  isActive: props.active,
  isTransparent: props.transparent
}));

const styles = useStyles("loading", meta, config);
</script>
