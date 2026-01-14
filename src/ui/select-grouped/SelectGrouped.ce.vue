<template>
  <div
    :role="props.multiple ? 'group' : 'radiogroup'"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :aria-required="props.required"
    :aria-disabled="props.disabled"
    :class="cn(styles.selectGrouped.root, props.class)"
    data-testid="select-grouped"
    v-auto-animate
  >
    <SelectGroupedGroup
      v-for="(group, index) in props.groups"
      :key="`group-${index}`"
      :group="group"
      :model-value="modelValue"
      :multiple="props.multiple"
      :required="props.required"
      :disabled="props.disabled"
      :columns="props.columns"
      :group-class="props.groupClass"
      :uiConfig="props.uiConfig"
      :data-hover="props.dataHover"
      :data-focus="props.dataFocus"
      @update:model-value="onChange"
      @action="onAction"
    >
      <template #item="slotProps">
        <slot name="item" v-bind="slotProps" />
      </template>
      <template v-if="$slots.header" #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template v-if="$slots['dropdown-item']" #dropdown-item="slotProps">
        <slot name="dropdown-item" v-bind="slotProps" />
      </template>
    </SelectGroupedGroup>
    <slot name="additional-item" :size="styles.selectGrouped.group.size" />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectGrouped.config";

// --- components
import SelectGroupedGroup from "./SelectGroupedGroup.vue";

// --- types
import type { SelectGroupedProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SelectGroupedProps>(), {
  columns: 1,
  multiple: false,
  required: false,
  disabled: false,
  class: "",
  groupClass: ""
});

const emits = defineEmits<{
  "update:modelValue": [value: string | string[]];
  action: [{ name: string; event: Event }];
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  columns: props.columns
}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.group"],
  meta,
  config,
  props.uiConfig ?? {}
);

const onChange = (value: string | string[]) => {
  modelValue.value = value;
};

const onAction = (value: { name: string; event: Event }) => {
  emits("action", value);
};
</script>
