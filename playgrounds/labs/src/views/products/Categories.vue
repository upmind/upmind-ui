<template>
  <div data-foo :class="props.class">
    <ul class="m-0 flex max-h-full flex-col overflow-auto p-0">
      <Loading :active="meta.isLoading" class="w-full">
        <UpmCard
          as="li"
          @click="() => selectCategory('')"
          class="flex items-end rounded-none border-b border-primary bg-gradient-to-r from-primary to-primary bg-[length:0%_4px] bg-left-bottom bg-no-repeat px-6 py-5 text-xl transition-all duration-300 ease-in-out"
          :class="{
            'text-auto hover:text-dm/25 dark:hover:text-dm-contrast/50':
              modelValue !== '',
            'border-b-primary bg-[length:100%_4px] text-primary':
              modelValue === '',
          }"
        >
          <span class="font-bold md:text-2xl">All</span>
        </UpmCard>

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
import { useVModel } from "@vueuse/core";
import { HTMLAttributes } from "vue";

import { UpmCard } from "@upmind-automation/client-vue";
import { Loading } from "@upmind-automation/upmind-ui";
import CategoryItem from "./CategoryItem.vue";
import { useProductCategories } from "@upmind-automation/headless";

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

function selectCategory(value: string) {
  modelValue.value = value;
}
</script>
