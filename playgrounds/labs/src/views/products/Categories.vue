<template>
  <div data-foo :class="props.class">
    <ul class="m-0 flex max-h-full flex-col overflow-auto p-0">
      <Loading :active="meta.isLoading" class="w-full">
        <CategoryItem
          v-for="category in categories"
          v-model="modelValue"
          :key="category.id"
          :category="category"
          :depth="0"
        />
      </Loading>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import { Loading } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";
import { useProductCategories } from "@upmind-automation/headless";
import { HTMLAttributes, watch } from "vue";

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

const { data: categories, meta } = useProductCategories();

watch(
  () => categories.value,
  categories => {
    if (!isEmpty(categories) && !modelValue.value) {
      modelValue.value = categories[0].id;
    }
  },
  { immediate: true }
);
</script>
