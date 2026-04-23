<template>
  <ListboxItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group m-0! flex w-full cursor-pointer items-center gap-2 text-start outline-none select-none',
        props.itemClass
      )
    "
  >
    <span v-if="!props.noInput" :class="cn(styles.checkbox, props.class)">
      <ListboxItemIndicator>
        <Check class="text-control-checked-contrast h-3 w-3" />
      </ListboxItemIndicator>
    </span>

    <slot />
  </ListboxItem>
</template>

<script setup lang="ts">
import { Check } from "lucide-vue-next";
import {
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemProps,
  useForwardProps
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn, useStyles } from "../../utils";
import config from "./checkboxGroup.config";

const props = defineProps<
  ListboxItemProps & {
    index?: number;
    class?: HTMLAttributes["class"];
    itemClass?: HTMLAttributes["class"];
    noInput?: boolean;
    size?: "sm" | "md";
  }
>();

const meta = computed(() => ({
  size: props.size ?? "md"
}));

const styles = useStyles(["checkbox"], meta, config);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
