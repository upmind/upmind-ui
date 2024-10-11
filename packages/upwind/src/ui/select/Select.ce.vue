<template>
  <div v-if="label" class="mb-1 text-sm font-medium text-primary">
    {{ label }}
  </div>
  <SelectRoot v-bind="forwarded">
    <SelectTrigger v-bind="forwarded">
      <SelectValue v-bind="forwarded" class="text-sm text-primary" />
    </SelectTrigger>
    <SelectContent v-bind="forwarded">
      <SelectGroup v-bind="forwarded">
        <SelectItem
          v-bind="forwarded"
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          class="text-sm text-primary"
        >
          {{ item.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </SelectRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./select.config";

// --- components
import {
  SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./";

// --- types
import type { SelectRootEmits, SelectContentEmits } from "radix-vue";
import type { SelectProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectProps>(), {
  // --- props
  label: "",
  items: () => [],
  // -- variants
  color: "base",
  width: "full",
  variant: "control",
  // --- styles
  upwindConfig: () => ({ select: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits<SelectRootEmits & SelectContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  color: props.color,
  width: props.width,
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: { trigger: string };
}>;
</script>
