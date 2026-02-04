<script setup lang="ts">
import {
  SelectContent,
  type SelectContentEmits,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { persistentRing } from "../../assets/styles";
import { Icon } from "../icon";
import SelectScrollDownButton from "./SelectScrollDownButton.vue";
import SelectScrollUpButton from "./SelectScrollUpButton.vue";
import { cn } from "../../utils";

defineOptions({
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<
    SelectContentProps & { class?: HTMLAttributes["class"]; to?: string }
  >(),
  {
    position: "popper"
  }
);
const emits = defineEmits<SelectContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SelectPortal :to="to">
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 rounded-lg',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2',
          props.class,
          persistentRing
        )
      "
    >
      <SelectScrollUpButton>
        <Icon icon="chevron-up" size="2xs" class="text-muted" />
      </SelectScrollUpButton>
      <SelectViewport
        :class="
          cn(
            'border-none outline-none',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width)'
          )
        "
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton>
        <Icon icon="chevron-down" size="2xs" class="text-muted" />
      </SelectScrollDownButton>
    </SelectContent>
  </SelectPortal>
</template>
