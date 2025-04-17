<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <Input
        type="text"
        placeholder="Search for an address..."
        @update:model-value="onSearch"
        width="full"
      />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        v-if="isValid"
        align="start"
        side="bottom"
        class="z-50 mt-2 w-[--radix-popover-trigger-width] overflow-hidden rounded-lg border bg-white"
      >
        <ul v-if="results">
          <li
            v-for="(result, index) in results"
            :key="result.id"
            @click="$emit('select', result)"
            class="cursor-pointer px-4 py-2 hover:bg-gray-100"
          >
            {{ result.label }}
          </li>
        </ul>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { isEmpty } from "lodash-es";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from "radix-vue";
import { Input } from "../input";
import type { SearchItem } from "./types";

const props = withDefaults(
  defineProps<{
    results: SearchItem[];
    minQueryLength?: number;
  }>(),
  {
    minQueryLength: 3,
  }
);

const emit = defineEmits(["update:search", "select"]);

const search = ref("");

const onSearch = (value: string | number) => {
  search.value = value as string;
  emit("update:search", value);
};

const isValid = computed(() => {
  return search.value.length >= props.minQueryLength && !isEmpty(props.results);
});
</script>
