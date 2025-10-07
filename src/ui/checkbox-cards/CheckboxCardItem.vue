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
            'group-focus-visible:ring-bg-control-ring group-focus:ring-bg-control-ring group-active:ring-bg-control-ring outline-hidden group-focus:ring-2 group-focus:ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-active:ring-2',
            'ring-offset-bg-control-surface',
            'data-[state=unchecked]:shadow-control-default data-[state=checked]:shadow-control-checked text-primary aspect-square h-4 w-4 rounded-sm disabled:cursor-not-allowed disabled:opacity-50',
            'text-control-foreground data-[state=checked]:bg-control-checked data-[state=unchecked]:group-hover:shadow-control-hover flex shrink-0 cursor-pointer items-center justify-center transition-none duration-0'
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
