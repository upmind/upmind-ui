<template>
  <RadioCardItem
    v-if="render"
    :item="{
      value: item.id,
      label: item.primary ? item.label : undefined,
      price: item.price,
    }"
    :index="item.id"
    :name="item.primary ? item.group : item.name"
    :label="item.label"
    :required="required"
    :value="item.id"
    :disabled="disabled"
    :model-value="modelValue"
    :variants="variants"
    :expanded="expanded"
    :expandable="item.primary"
    :minify="!item.primary"
    :class="[
      (item.group && item.primary && expanded) ||
      (item.group && !item.primary && !isLastInGroup)
        ? 'border-b-0'
        : '',
    ]"
    @expand="item.primary ? toggleExpanded() : undefined"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </RadioCardItem>
</template>

<script setup lang="ts">
import RadioCardItem from "./RadioCardItem.vue";
import { computed } from "vue";

const props = defineProps<{
  item: any;
  name: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  variants: any;
  expanded?: boolean;
  isLastInGroup?: boolean;
}>();

const emit = defineEmits<{
  expand: [];
}>();

const toggleExpanded = () => {
  emit("expand");
};

const render = computed(
  () => props.item.primary || (!props.item.primary && props.expanded)
);
</script>
