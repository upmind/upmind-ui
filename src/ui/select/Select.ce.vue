<template>
  <Select v-bind="forwarded" :key="uid">
    <SelectTrigger :class="cn(styles.select, props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="item in items"
          :key="item.value"
          :value="item.const?.toString() || item.value?.toString()"
        >
          <span class="flex items-center space-x-1">
            <span>{{ item?.title || item?.textValue }}</span>
            <span v-if="item?.label" class="opacity-60">{{ item?.label }}</span>
          </span>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
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
import { timestamp } from "@vueuse/shared";

const props = withDefaults(defineProps<SelectProps>(), {
  // --- props
  items: () => [],
  // -- styles
  width: "full",
  // --- styles
  uiConfig: () => ({ select: [] }),
  class: "",
});

const emits = defineEmits<SelectRootEmits & SelectContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

// --- This is needed as if we have changed items AFTER model is set then ...
//     the component does not re-render with the correct selected value
const uid = ref(timestamp());

const meta = computed(() => ({
  size: props.size,
  width: props.width,
}));

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: [];
}>;

// NB: set the new timestamp when items change to force a re-render
watch(
  () => props.items,
  () => {
    uid.value = timestamp();
  },
  { immediate: true }
);
</script>
