<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group m-0! flex w-full items-start rounded-sm text-start outline-none select-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      class="size-lh text-md/tight flex items-center justify-center"
      :class="props.noInput ? 'sr-only' : ''"
    >
      <span
        :class="
          cn(
            ringClasses,
            'ring-offset-background-control-surface data-[state=checked]:bg-control-checked',
            'data-[state=unchecked]:shadow-border-control-default data-[state=checked]:shadow-border-control-checked text-primary h-4 w-4 rounded-sm disabled:cursor-not-allowed disabled:opacity-50',
            'flex shrink-0 items-center justify-center',
            '[button[data-state=on]_&]:text-control-active-foreground [button[data-state=on]_&]:bg-control-active [button[data-state=off]_&]:text-transparent',

            props.class,
            props.noInput ? 'sr-only' : ''
          )
        "
        :data-state="props.checked ? 'checked' : 'unchecked'"
        :data-hover="$attrs['data-hover']"
        :data-focus="$attrs['data-focus']"
      >
        <Check class="text-control-checked-contrast h-3 w-3" />
      </span>
    </span>

    <slot />
  </ToggleGroupItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Check } from "lucide-vue-next";
import {
  ToggleGroupItem,
  useForwardProps,
  type ToggleGroupItemProps
} from "radix-vue";
import { ringClasses } from "../../assets/ring.styles";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  ToggleGroupItemProps & {
    index?: number;
    class?: HTMLAttributes["class"];
    itemClass?: HTMLAttributes["class"];
    noInput?: boolean;
    checked?: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
