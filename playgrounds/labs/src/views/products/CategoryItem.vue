<template>
  <li
    class="flex items-end rounded-none border-b border-primary bg-gradient-to-r from-primary to-primary bg-[length:0%_4px] bg-left-bottom bg-no-repeat py-5 text-xl transition-all duration-300 ease-in-out"
    :class="{
      'text-auto hover:text-dm/25 dark:hover:text-dm-contrast/50':
        modelValue !== category.id,
      'border-b-primary bg-[length:100%_4px] text-primary':
        modelValue === category.id,
    }"
    :style="{ paddingLeft: `${0.5 + depth * 0.5}rem` }"
  >
    <div class="flex flex-grow items-center" @click="toggleExpand">
      <span v-if="category.categories && category.categories.length">
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
        class="ml-auto mr-4 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
        >{{ category.count }}</span
      >
    </div>
  </li>
  <ul v-if="isExpanded && category.categories && category.categories.length">
    <CategoryItem
      v-for="subCategory in category.categories"
      :key="subCategory.id"
      :category="subCategory"
      :model-value="modelValue"
      @update:modelValue="val => $emit('update:modelValue', val)"
      :depth="depth + 1"
    />
  </ul>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useVModel } from "@vueuse/core";
import { ProductCategory } from "@upmind-automation/headless";

const props = defineProps<{
  depth: number;
  category: ProductCategory;
  modelValue?: string;
}>();

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: "",
});

const isExpanded = ref(false);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  modelValue.value = props.category.id;
}
</script>
