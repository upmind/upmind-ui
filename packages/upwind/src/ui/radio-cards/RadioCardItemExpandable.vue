<!-- ExpandableRadioCards.vue -->
<template>
  <div class="flex flex-col space-y-3">
    <RadioCardItem
      :item="{ value: item.values[0].id, label: item.label }"
      :index="0"
      :name="item.label"
      :required="required"
      :value="item.values[0].id"
      :disabled="disabled"
      radio-class=""
      :model-value="modelValue"
      :variants="variants"
    >
      <template #item="{ item }">
        {{ item.label }}
      </template>
    </RadioCardItem>

    <template v-for="(itemValue, index) in item.values.slice(1)">
      <div
        v-if="item.values.length > 1"
        :key="itemValue.id || index"
        v-show="isExpanded"
      >
        <RadioCardItem
          :item="{ label: itemValue.name, value: itemValue.id }"
          :index="index"
          :name="itemValue.name"
          :required="required"
          :value="itemValue.id"
          :disabled="disabled"
          radio-class=""
          :model-value="modelValue"
          :variants="variants"
        >
          <slot name="item" v-bind="{ itemValue, index }">
            {{ itemValue.name }}
          </slot>
        </RadioCardItem>
      </div>
    </template>

    <button v-if="item.values.length > 1" @click="toggleExpanded" type="button">
      {{ isExpanded ? "Show less" : "Show more" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RadioCardItem from "./RadioCardItem.vue";

const props = defineProps<{
  item: any;
  name: string;
  required: boolean;
  disabled: boolean;
  radioClass: string;
  modelValue: any;
  variants: any;
}>();

const isExpanded = ref(false);
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};
</script>
