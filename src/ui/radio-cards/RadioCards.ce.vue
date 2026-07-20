<template>
  <component
    :is="useInputGroup ? RadioGroup : 'div'"
    :model-value="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.radioCards.root, props.class)"
    @update:model-value="(v: string | number) => onChange(v)"
    v-auto-animate
  >
    <template v-for="(option, index) in items" :key="option.id || index">
      <RadioCardItem
        v-bind="testAttrs(option, index)"
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
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
import { RadioGroup } from "../radio-group";
import RadioCardItem from "./RadioCardItem.vue";
import config from "./radioCards.config";
import { cn, useStyles, useTestAttrs } from "../../utils";
import type { RadioCardsItemProps, RadioCardsProps } from "./types";
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

defineEmits<{
  focus: [FocusEvent];
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const modelValue = defineModel<string | number>();

const meta = computed(() => ({
  columns: props.columns
}));

const styles = useStyles(
  ["radioCards", "radioCards.item"],
  meta,
  config,
  props.uiConfig ?? {}
);

/* Bind the attrs object directly — the old useForwardPropsEmits(attrs, emits)
   wrapping returned a computed ref that v-bind never unwrapped, so no test
   attrs (and no forwarded emit handlers) ever reached the items. */
const testAttrs = (item: RadioCardsItemProps, index: number) =>
  useTestAttrs({
    key: "radio-card-item",
    value: [item.id, item.value, index],
    dataAttrs: item.dataAttrs
  });

const onChange = (value: string | number) => {
  if (props.disabled) return;

  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
};
</script>
