<template>
  <div
    role="radiogroup"
    :aria-required="props.required"
    :aria-disabled="props.disabled"
    :class="cn(styles.selectGrouped.root, props.class)"
    data-testid="select-grouped"
    v-auto-animate
  >
    <SelectGroupedGroup
      v-for="(group, index) in props.groups"
      ref="groupRefs"
      :key="`group-${index}`"
      :group="group"
      :index="index"
      :focused-group-index="focusedGroupIndex"
      :model-value="modelValue"
      :required="props.required"
      :disabled="props.disabled"
      :columns="props.columns"
      :uiConfig="props.uiConfig"
      @update:model-value="onChange"
      @action="onAction"
      @focus-next-group="focusGroup(index + 1)"
      @focus-prev-group="focusGroup(index - 1)"
    >
      <template #item="slotProps">
        <slot name="item" v-bind="slotProps" />
      </template>
      <template v-if="$slots.icon" #icon="slotProps">
        <slot name="icon" v-bind="slotProps" />
      </template>
      <template v-if="$slots.header" #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template v-if="$slots['header-label']" #header-label="slotProps">
        <slot name="header-label" v-bind="slotProps" />
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
import { computed, ref } from "vue";
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
  required: false,
  disabled: false,
  class: ""
});

const emits = defineEmits<{
  "update:modelValue": [value: string];
  action: [{ name: string; event: Event }];
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const groupRefs = ref<{ focus: () => void }[]>([]);
const focusedGroupIndex = ref(0);

const meta = computed(() => ({
  columns: props.columns
}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.group"],
  meta,
  config,
  props.uiConfig ?? {}
);

const onChange = (value: string) => {
  modelValue.value = value;
};

const onAction = (value: { name: string; event: Event }) => {
  emits("action", value);
};

const focusGroup = (index: number) => {
  const clampedIndex = Math.max(0, Math.min(index, props.groups.length - 1));
  focusedGroupIndex.value = clampedIndex;
  groupRefs.value[clampedIndex]?.focus();
};
</script>
