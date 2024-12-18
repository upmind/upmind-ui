<!-- ExpandableRadioCards.vue -->
<template>
  <div
    v-auto-animate
    class="flex flex-col space-y-0 border border-control shadow-sm"
  >
    <RadioCardItem
      class="border-l-0 border-r-0 border-t-0 border-b-control border-opacity-50 shadow-none"
      :class="expanded ? 'border-b' : 'border-b-0'"
      :item="{
        value: item.values[0].id,
        label: item.label,
        price: item.values[0].price,
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
      :expanded="expanded"
      @toggle-expanded="toggleExpanded"
    >
      <template #default="slotProps">
        <slot
          v-bind="{
            ...slotProps,
            item: {
              ...slotProps.item,
              icon: item.values[0].meta?.uischema?.icon,
            },
          }"
        />
      </template>
    </RadioCardItem>

    <template v-for="(itemValue, index) in items" :key="itemValue.id || index">
      <RadioCardItem
        class="border-b border-l-0 border-r-0 border-t-0 border-b-control border-opacity-50 shadow-none last:border-b-0"
        :item="{
          label: itemValue.name,
          value: itemValue.id,
          price: itemValue.price,
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
        minify
      >
        <template #default="slotProps">
          <div>
            <slot
              v-bind="{
                ...slotProps,
                item: {
                  ...slotProps.item,
                  label: item.label,
                  icon: itemValue.meta?.uischema?.icon,
                },
              }"
            />
          </div>
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

const expanded = ref(false);
const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

const items = computed(() => {
  if (props.item.values.length > 1 && expanded.value) {
    return props.item.values.slice(1);
  }
  return [];
});
</script>
