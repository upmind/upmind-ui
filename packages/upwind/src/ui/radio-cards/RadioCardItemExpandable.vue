<!-- ExpandableRadioCards.vue -->
<template>
  <div v-auto-animate class="flex flex-col space-y-3">
    <RadioCardItem
      :item="{
        value: item.values[0].id,
        label: item.label,
        price: item.values[0].price,
        ...item.values[0],
      }"
      :index="0"
      :name="item.label"
      :label="item.values[0].name"
      :required="required"
      :value="item.values[0].id"
      :disabled="disabled"
      radio-class=""
      :model-value="modelValue"
      :variants="variants"
      expandable
      :expanded="isExpanded"
      @toggle-expanded="toggleExpanded"
    >
      <template #default="slotProps">
        <slot v-bind="slotProps" />
      </template>
    </RadioCardItem>

    <template v-for="(itemValue, index) in items" :key="itemValue.id || index">
      <RadioCardItem
        :item="{
          label: itemValue.name,
          value: itemValue.id,
          price: itemValue.price,
          ...itemValue,
        }"
        :index="index"
        :name="item.label"
        :label="itemValue.name"
        :required="required"
        :value="itemValue.id"
        :disabled="disabled"
        radio-class=""
        :model-value="modelValue"
        :variants="variants"
        :price="itemValue.price"
      >
        <template #default="slotProps">
          <slot v-bind="slotProps" />
        </template>
      </RadioCardItem>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import RadioCardItem from "./RadioCardItem.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

const props = defineProps<{
  item: any;
  name: string;
  required: boolean;
  disabled: boolean;
  radioClass: string;
  modelValue: any;
  variants: any;
  price: any;
}>();

const isExpanded = ref(false);
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const items = computed(() => {
  if (props.item.values.length > 1 && isExpanded.value) {
    return props.item.values.slice(1);
  }
  return [];
});
</script>
