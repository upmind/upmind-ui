<template>
  <div :class="variants.select.root">
    <div v-if="label" class="mb-1 text-sm font-medium">
      {{ label }}
    </div>
    <SelectRoot v-bind="forwarded">
      <SelectTrigger
        v-bind="forwarded"
        :class="cn(variants.select.trigger, props.class)"
      >
        <SelectValue
          :class="variants.select.root"
          v-bind="forwarded"
          class="text-sm"
        />
      </SelectTrigger>
      <SelectContent v-bind="forwarded">
        <SelectGroup v-bind="forwarded">
          <SelectItem
            v-bind="forwarded"
            v-for="item in items"
            :key="item.value"
            :value="item.value"
            class="text-sm"
            :class="variants.select.root"
          >
            {{ item.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  </div>
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
  width: "full",
  variant: "control",
  color: "base",
  // --- styles
  upwindConfig: () => ({ select: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits<SelectRootEmits & SelectContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  width: props.width,
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: { root: string; trigger: string };
}>;
</script>
