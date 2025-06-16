<template>
  <div
    data-foo
    class="flex flex-col items-center gap-y-12"
    :class="props.class"
  >
    <div class="flex max-h-full flex-col overflow-auto">
      <a
        href="javascript:void(0);"
        @click="() => selectCategory('')"
        class="flex items-end border-b border-primary bg-gradient-to-r from-primary to-primary bg-[length:0%_4px] bg-left-bottom bg-no-repeat px-6 py-5 text-xl transition-all duration-300 ease-in-out"
        :class="{
          'text-auto hover:text-dm/25 dark:hover:text-dm-contrast/50':
            modelValue !== '',
          'border-b-primary bg-[length:100%_4px] text-primary':
            modelValue === '',
        }"
      >
        <span class="font-bold md:text-2xl">All</span>
      </a>

      <template
        v-if="meta.isLoading || meta.hasError"
        v-for="i in skeletonCount"
      >
        <UpmCard>
          <Loading />
        </UpmCard>
      </template>

      <template v-for="category in categories" :key="category.id">
        <a
          @click="() => selectCategory(category.id)"
          class="flex items-end border-b border-primary bg-gradient-to-r from-primary to-primary bg-[length:0%_4px] bg-left-bottom bg-no-repeat px-6 py-5 text-xl transition-all duration-300 ease-in-out"
          :class="{
            'text-auto hover:text-dm/25 dark:hover:text-dm-contrast/50':
              modelValue !== category.id,
            'border-b-primary bg-[length:100%_4px] text-primary':
              modelValue === category.id,
          }"
        >
          <span class="font-bold md:text-2xl">{{ category.name }}</span>
        </a>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import { useProductCategories } from "@upmind-automation/headless";
import { UpmCard } from "@upmind-automation/client-vue";
import { Loading } from "@upmind-automation/upmind-ui";
import { HTMLAttributes } from "vue";

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
