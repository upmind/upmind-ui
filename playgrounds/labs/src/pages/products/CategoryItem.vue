<template>
  <li
    class="border-primary from-primary to-primary flex items-end rounded-none border-b bg-linear-to-r bg-bottom-left bg-no-repeat py-5 text-xl transition-all duration-200 ease-in-out"
    :class="{
      'text-auto hover:text-dm/25 dark:hover:text-dm-contrast/50':
        modelValue !== category.id,
      'border-b-primary text-primary bg-size-[100%_4px]':
        modelValue === category.id
    }"
    :style="{ paddingLeft: `${0.5 + depth * 0.5}rem` }"
  >
    <div class="flex grow items-center" @click="toggleExpand">
      <span v-if="category.children?.length">
        <svg
          class="mr-2 h-4 w-4 transform transition-transform"
          :class="{ 'rotate-90': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          ></path>
        </svg>
      </span>
      <span class="font-bold md:text-2xl">{{ category.name }}</span>
      <span
        v-if="category.count"
        class="mr-4 ml-auto rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
        >{{ category.count }}</span
      >
    </div>
  </li>
  <ul v-if="isExpanded && category.children?.length">
    <CategoryItem
      v-for="subCategory in category.children"
      :key="subCategory.id"
      :category="subCategory"
      :model-value="modelValue"
      @update:modelValue="val => $emit('update:modelValue', val)"
      :depth="depth + 1"
    />
  </ul>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { ref } from "vue";
import type { ProductCategory } from "@upmind-automation/headless";

const props = withDefaults(
  defineProps<{
    depth?: number;
    category: ProductCategory;
    modelValue?: string;
  }>(),
  {
    depth: 0,
    modelValue: ""
  }
);

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: ""
});

const isExpanded = ref(false);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  modelValue.value = props.category.id;
}
</script>
