<template>
  <Toggle
    v-bind="forwarded"
    :class="cn(toggleVariants({ variant, size }), props.class)"
  >
    <slot />
  </Toggle>
</template>

<script setup lang="ts">
import { cn } from "../..//utils";
import {
  Toggle,
  type ToggleEmits,
  type ToggleProps,
  useForwardPropsEmits
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { type ToggleVariantProps } from "./types";
import { toggleVariants } from "./toggle.config";

const props = withDefaults(
  defineProps<
    ToggleProps & {
      class?: HTMLAttributes["class"];
      variant?: ToggleVariantProps["variant"];
      size?: ToggleVariantProps["size"];
    }
  >(),
  {
    variant: "default",
    size: "default",
    disabled: false
  }
);

const emits = defineEmits<ToggleEmits>();

const delegatedProps = computed(() => {
  const { class: _, size, variant, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>
