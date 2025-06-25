<template>
  <div data-foo :class="props.class">
    <input
      type="search"
      v-model="searchQuery"
      @input="debouncedFilterQuery"
      placeholder="Filter categories..."
      class="w-full rounded-md border border-gray-300 p-2"
    />
    <ul
      v-if="!!searchQuery"
      class="m-0 flex max-h-full flex-col overflow-auto p-0"
    >
      <Loading :active="meta.isLoading" class="w-full">
        <CategoryItem
          v-for="category in filteredCategories"
          v-model="modelValue"
          :key="`filtered-${category.id}`"
          :category="category"
        />
      </Loading>
    </ul>

    <ul v-else class="m-0 flex max-h-full flex-col overflow-auto p-0">
      <Loading :active="meta.isLoading" class="w-full">
        <CategoryItem :category="all" v-model="modelValue" />
        <CategoryItem
          v-for="category in categories"
          v-model="modelValue"
          :key="category.id"
          :category="category"
        />
      </Loading>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { Loading } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";
import { debounce } from "lodash-es";
import {
  ProductCategory,
  useProductCategories,
} from "@upmind-automation/headless";
import { HTMLAttributes, ref } from "vue";

import CategoryItem from "./CategoryItem.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    skeletonCount?: number;
    class?: HTMLAttributes["class"];
  }>(),
  {
    skeletonCount: 4,
  }
);

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: "",
});

const { data: categories, meta, filter } = useProductCategories();

const all: ProductCategory = {
  id: "",
  name: "All Categories",
  title: "All Categories",
  uiMeta: {
    uischema: {
      icon: "all-categories",
    },
  },
};

const searchQuery = ref("");
const filteredCategories = ref(categories.value);

const debouncedFilterQuery = debounce(() => {
  filteredCategories.value = filter(searchQuery.value);
}, 500);
</script>
