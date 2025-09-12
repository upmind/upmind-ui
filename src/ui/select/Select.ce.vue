<template>
  <Select
    v-bind="forwarded"
    v-model:open="open"
    :key="uid"
    :model-value="modelValue"
  >
    <SelectTrigger :class="cn(styles.select.root, props.class)">
      <SelectValue :placeholder="placeholder" :class="styles.select.value" />
      <template #icon>
        <Icon
          class="text-emphasis-medium group-hover:text-emphasis-none ml-auto pl-4 transition-all duration-200 [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-300"
          :class="open ? '[&>svg]:rotate-180' : ''"
          icon="arrow-down"
          size="xs"
        />
      </template>
    </SelectTrigger>

    <SelectContent :class="styles.select.content" :align="align" :to="to">
      <SelectGroup>
        <SelectItem
          v-for="item in items"
          :key="item.value"
          :value="item.const || item.value"
          :class="styles.select.item"
        >
          <template #indicator>
            <SelectIndicator
              :data-state="item.value === modelValue ? 'checked' : 'unchecked'"
              :value="item.value"
            />
          </template>
          <span class="flex items-center space-x-1">
            <span v-if="item?.title || item?.textValue">{{
              item?.title || item?.textValue
            }}</span>
            <span v-if="item?.label">{{ item?.label }}</span>
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
import { useVModel } from "@vueuse/core";

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
import SelectIndicator from "./SelectIndicator.vue";
import Icon from "../icon/Icon.vue";

// --- types
import type { SelectRootEmits, SelectContentEmits } from "radix-vue";
import type { SelectProps } from "./types";
import type { ComputedRef } from "vue";
import { timestamp } from "@vueuse/shared";
import { isEqual } from "lodash-es";

const props = withDefaults(defineProps<SelectProps>(), {
  // --- props
  items: () => [],
  placeholder: "Select an option",
  // -- styles
  variant: "outline",
  size: "md",
  width: "full",
  ring: true,
  // --- styles
  uiConfig: () => ({
    select: {
      root: [],
      value: [],
      item: []
    }
  }),
  class: ""
});

const emits = defineEmits<SelectRootEmits & SelectContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const open = ref(false);

// --- This is needed as if we have changed items AFTER model is set then ...
//     the component does not re-render with the correct selected value
const uid = ref(timestamp());

const meta = computed(() => ({
  width: props.width,
  variant: props.variant,
  hasValue: !!props.modelValue,
  hasRing: props.ring
}));

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: {
    root: string;
    content: string;
    value: string;
    item: string;
  };
}>;

// NB: set the new timestamp when items change to force a re-render
watch(
  () => props.items,
  (newItems, oldItems) => {
    if (isEqual(newItems, oldItems)) return;
    uid.value = timestamp();
  },
  { immediate: true }
);
</script>
