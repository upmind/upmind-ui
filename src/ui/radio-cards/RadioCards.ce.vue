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
        @action="emits('action', $event)"
      >
        <template v-if="$slots.item" #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" v-bind="{ item: option.item, option }" />
        </template>
        <template v-if="$slots.secondary" #secondary>
          <slot name="secondary" v-bind="{ item: option.item, option }" />
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append" v-bind="{ item: option.item, option }" />
        </template>
      </RadioCardItem>
    </template>
    <slot name="additional-item" :size="styles.radioCards.item.size" />
  </component>
</template>

<script setup lang="ts">
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
// --- internal
import { RadioGroup } from "../radio-group";
import RadioCardItem from "./RadioCardItem.vue";
import config from "./radioCards.config";
import { cn, useStyles } from "../../utils";
// --- utils
import { kebabCase } from "lodash-es";
// --- types
import type { RadioCardsProps, RadioCardsItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsProps>(), {
  overrideIndex: 0,
  useInputGroup: true,
  columns: 1,
  class: "",
  radioClass: ""
});

const emits = defineEmits<{
  action: [event: Event];
}>();

defineSlots<{
  item(props: { item: any }): any;
  prepend(props: { item: any; option: RadioCardsItemProps }): any;
  append(props: { item: any; option: RadioCardsItemProps }): any;
  secondary(props: { item: any; option: RadioCardsItemProps }): any;
  "additional-item"(props: { size: string }): any;
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

const onChange = (value: any) => {
  if (props.disabled) return;

  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
};
</script>
