<template>
  <Select v-bind="forwarded">
    <SelectTrigger :class="cn(variants.select, props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="item in items"
          :key="item.value"
          :value="item.const || item.value"
        >
          {{ item?.label || item?.title || item?.textValue }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./select.config";

// --- components
import Select from "./Select.vue";
import SelectTrigger from "./SelectTrigger.vue";
import SelectContent from "./SelectContent.vue";
import SelectGroup from "./SelectGroup.vue";
import SelectItem from "./SelectItem.vue";
import SelectValue from "./SelectValue.vue";

// --- types
import type { SelectRootEmits, SelectContentEmits } from "radix-vue";
import type { SelectProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectProps>(), {
  // --- props
  items: () => [],
  // -- variants
  size: "md",
  width: "full",
  // --- styles
  upwindConfig: () => ({ select: {} }),
  class: "",
});

const emits = defineEmits<SelectRootEmits & SelectContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  size: props.size,
  width: props.width,
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: [];
}>;
</script>
