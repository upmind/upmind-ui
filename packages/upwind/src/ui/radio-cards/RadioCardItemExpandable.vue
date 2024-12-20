<template>
  <RadioCardItem
    v-if="item.primary"
    :item="{
      value: item.id,
      label: item.label,
      price: item.price,
    }"
    :index="item.id"
    :name="item.group"
    :label="item.label"
    :required="required"
    :value="item.id"
    :disabled="disabled"
    :model-value="modelValue"
    :variants="variants"
    expandable
    :expanded="expanded"
    @expand="toggleExpanded"
  >
    <template #default="slotProps">
      <slot
        v-bind="{
          ...slotProps,
        }"
      />
    </template>
  </RadioCardItem>

  <RadioCardItem
    v-if="!item.primary && expanded"
    :item="{
      value: item.id,
      price: item.price,
    }"
    :index="item.id"
    :name="item.name"
    :label="item.label"
    :required="required"
    :value="item.id"
    :disabled="disabled"
    :model-value="modelValue"
    :variants="variants"
    :expanded="expanded"
    minify
  >
    <template #default="slotProps">
      <div>
        <slot
          v-bind="{
            ...slotProps,
          }"
        />
      </div>
    </template>
  </RadioCardItem>
  <!-- <template v-for="(itemValue, index) in items" :key="itemValue.id || index">

    </template> -->
</template>

<script setup lang="ts">
import RadioCardItem from "./RadioCardItem.vue";

defineProps<{
  item: any;
  name: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  variants: any;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  expand: [];
}>();

const toggleExpanded = () => {
  emit("expand");
};
</script>
