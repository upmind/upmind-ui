<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import type { CheckboxRootEmits, CheckboxRootProps } from "radix-vue";
import {
  CheckboxIndicator,
  CheckboxRoot,
  useForwardPropsEmits
} from "radix-vue";
import { Check } from "lucide-vue-next";
import { cn } from "../../utils";

const props = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'data-[state=checked]:text-control-active-foreground focus-visible:ring-ring border-control ring-offset-background data-[state=checked]:bg-control-active peer h-4 w-4 shrink-0 rounded-xs border peer-last:ml-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <CheckboxIndicator
      class="flex h-full w-full items-center justify-center text-current"
    >
      <slot>
        <!-- <Icon icon="check" /> -->
        <Check class="h-3 w-3" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
