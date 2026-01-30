<template>
  <component
    :is="useInputGroup ? RadioGroup : 'div'"
    :model-value="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.radioCards.root, props.class)"
    data-testid="radio-card-group"
    @update:model-value="(v: string | number) => onChange(v)"
    v-auto-animate
  >
    <template v-for="(option, index) in items" :key="option.id || index">
      <RadioCardItem
        v-bind="forwarded"
        :item="option.item"
        :index="option.index || overrideIndex || index"
        :name="props.name"
        :label="option?.label"
        :secondaryLabel="option?.secondaryLabel"
        :description="option?.description"
        :secondaryDescription="option?.secondaryDescription"
        :badge="option?.badge"
        :secondaryBadge="option?.secondaryBadge"
        :action="option?.action"
        :required="props.required"
        :disabled="props.disabled"
        :model-value="modelValue"
        :columns="props.columns"
        :value="option.value"
        :class="props.radioClass"
        :uiConfig="props.uiConfig"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
        :data-testid="`radio-card-${kebabCase(option.label) || index}`"
        @keydown.enter="onChange(option.value)"
        @click="() => onChange(option.value)"
      >
        <template #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
      </RadioCardItem>
    </template>
    <slot name="additional-item" :size="styles.radioCards.item.size" />
  </component>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { useForwardPropsEmits } from "radix-vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { kebabCase } from "lodash-es";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup } from "../radio-group";
import RadioCardItem from "./RadioCardItem.vue";

// --- types
import type { RadioCardsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioCardsProps>(), {
  // --- props
  overrideIndex: 0,
  useInputGroup: true,
  // -- variants
  columns: 1,
  // --- styles
  class: "",
  radioClass: ""
});

const emits = defineEmits<{
  "update:modelValue": [string | number];
  focus: [FocusEvent];
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const forwarded = useForwardPropsEmits({}, emits);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  columns: props.columns
}));

const styles = useStyles(
  ["radioCards", "radioCards.item"],
  meta,
  config,
  props.uiConfig ?? {}
);

const onChange = (value: any) => {
  if (props.disabled) return;

  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
};

const onAction = (value: any) => {
  emits("action", value);
};
</script>
