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
        'ring-offset-background-control-surface',
        'data-[state=unchecked]:shadow-border-control-default data-[state=checked]:shadow-border-control-default text-primary aspect-square h-4 w-4 rounded-sm disabled:cursor-not-allowed disabled:opacity-50',
        'text-control-foreground data-[state=checked]:bg-control-checked data-[state=unchecked]:hover:shadow-border-control-hover shrink-0 cursor-pointer transition-all duration-200',
        props.class
      )
    "
    :data-state="$attrs['data-state']"
  >
    <CheckboxIndicator
      class="flex h-full w-full items-center justify-center text-current"
    >
      <slot>
        <Check class="text-control-checked-contrast h-3 w-3" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
