<template>
  <component
    :is="props.as"
    role="radiogroup"
    :aria-required="props.required"
    :aria-disabled="props.disabled"
    :class="cn(styles.selectGrouped.root, props.class)"
    data-testid="select-grouped"
    v-auto-animate
  >
    <SelectGroupedOption
      v-for="(group, index) in props.groups"
      ref="groupRefs"
      :key="`group-${index}`"
      :group="group"
      :index="index"
      :focused-group-index="focusedGroupIndex"
      :model-value="modelValue"
      :required="props.required"
      :disabled="props.disabled"
      :uiConfig="props.uiConfig"
      @update:model-value="onChange"
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
    </SelectGroupedOption>
    <slot name="additional-item" :size="styles.selectGrouped.group.size" />
  </component>
</template>

<script setup lang="ts">
/**
 * Main container component for grouped selection UI.
 *
 * Renders a radio group with support for single-item options (direct selection)
 * and multi-item options (collapsible dropdown). Manages focus navigation between
 * options and emits selection changes via v-model.
 */
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed, ref } from "vue";
// --- internal
import config from "./selectGrouped.config";
// --- components
import SelectGroupedOption from "./SelectGroupedOption.vue";
import { cn, useStyles } from "../../utils";
// --- types
import type { SelectGroupedProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SelectGroupedProps>(), {
  required: false,
  disabled: false,
  as: "ul",
  class: ""
});

const modelValue = defineModel<string>({ default: "" });

const groupRefs = ref<{ setFocus: () => void }[]>([]);
const focusedGroupIndex = ref(0);

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.group"],
  meta,
  config,
  props.uiConfig ?? {}
);

const onChange = (value: string) => {
  modelValue.value = value;
};

const focusGroup = (index: number) => {
  const clampedIndex = Math.max(0, Math.min(index, props.groups.length - 1));
  focusedGroupIndex.value = clampedIndex;
  groupRefs.value[clampedIndex]?.setFocus();
};
</script>
