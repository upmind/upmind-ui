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
import { ringClasses } from "../../assets/ring.styles";

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
        ringClasses,
        'data-[state=checked]:text-background-control-checked-contrast shadow-border-border-control-default data-[state=checked]:shadow-border-none bg-background-control-checked',
        'h-3 w-3 shrink-0 rounded-sm border-none peer-last:ml-2 disabled:cursor-not-allowed disabled:opacity-50',
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
