<template>
  <Select
    v-bind="forwarded"
    v-model:open="open"
    :key="uid"
    :model-value="modelValue"
  >
    <SelectTrigger
      v-bind="$attrs"
      :class="cn(styles.select.root, props.class)"
      :data-hover="props.dataHover"
      :data-focus="props.dataFocus"
    >
      <SelectValue
        :placeholder="placeholder"
        :class="styles.select.value"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
      />
      <span
        v-if="
          (isEmpty(placeholder) &&
            (isEmpty(modelValue) || isNull(modelValue))) ||
          !hasSelectedItem
        "
        :class="styles.select.value"
        class="pointer-events-none invisible select-none"
      >
        &nbsp;
      </span>
      <template #icon>
        <Icon
          class="text-muted ml-auto pl-4 transition-all duration-200 group-hover:text-base [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-200"
          :class="open ? '[&>svg]:rotate-180' : ''"
          icon="chevron-down"
          size="xs"
        />
      </template>
    </SelectTrigger>

    <SelectContent :class="styles.select.content" :align="align" :to="to">
      <SelectGroup class="p-2">
        <SelectItem
          v-for="item in items"
          :key="item.value"
          :value="item.const || item.value"
          :class="styles.select.item"
        >
          <template #indicator />
          <span class="flex items-center space-x-1">
            <span v-if="item?.title || item?.textValue">{{
              item?.title || item?.textValue
            }}</span>
            <span v-if="item?.label">{{ item?.label }}</span>
          </span>
        </SelectItem>

        <SelectItem
          v-for="item in props.additionalItems"
          :class="styles.select.item"
          :key="'additional-' + item.value"
          :value="item.value"
        >
          <template #indicator>
            <Icon v-if="item.icon" :icon="item.icon" size="2xs" />
          </template>
          <span>{{ item.textValue }}</span>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
// --- external
import { ref, watch, computed } from "vue";
import { useForwardPropsEmits } from "radix-vue";
import { useVModel } from "@vueuse/core";

defineOptions({
  inheritAttrs: false
});

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

// --- utils
import { isEmpty, isEqual, isNull, find } from "lodash-es";

// --- types
import type { SelectRootEmits, SelectContentEmits } from "radix-vue";
import type { SelectProps } from "./types";
import { timestamp } from "@vueuse/shared";

const props = withDefaults(defineProps<SelectProps>(), {
  // --- props
  items: () => [],
  additionalItems: () => [],
  placeholder: "",
  // -- styles
  variant: "outline",
  size: "lg",
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

const hasSelectedItem = computed(
  () => !!find(props.items, { value: modelValue.value })
);

const meta = computed(() => ({
  variant: props.variant,
  width: props.width,
  size: props.size,
  hasValue: !!props.modelValue,
  hasRing: props.ring
}));

const styles = useStyles(["select"], meta, config, props.uiConfig ?? {});

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
