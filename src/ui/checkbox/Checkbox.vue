<script setup lang="ts">
import { Check } from "lucide-vue-next";
import {
  CheckboxIndicator,
  CheckboxRoot,
  useForwardPropsEmits
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { CheckboxRootEmits, CheckboxRootProps } from "radix-vue";

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
        'group-focus-visible:ring-control-ring group-focus:ring-control-ring group-active:ring-control-ring outline-hidden group-focus:ring-2 group-focus:ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-active:ring-2',
        'ring-offset-control-surface',
        'data-[state=unchecked]:shadow-control-default data-[state=checked]:shadow-control-checked text-primary aspect-square h-4 w-4 rounded-sm disabled:cursor-not-allowed disabled:opacity-50',
        'text-control-foreground data-[state=checked]:bg-control-checked data-[state=unchecked]:group-hover:shadow-control-hover flex shrink-0 cursor-pointer items-center justify-center transition-none duration-0'
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
