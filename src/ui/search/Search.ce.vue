<template>
  <PopoverRoot v-model:open="open" tabindex="-1">
    <PopoverTrigger class="w-full" tabindex="-1">
      <InputExtended
        v-model="search"
        type="text"
        :placeholder="placeholder"
        width="full"
        @update:model-value="onSearch"
        :class="styles.search.inputContainer"
        :input-class="styles.search.input"
      >
        <template #prepend>
          <Icon icon="search" :class="styles.search.icon" />
        </template>
      </InputExtended>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent v-if="meta.isOpen" :class="styles.search.content">
        <div
          v-for="item in results"
          :key="item.id"
          @click="onSelect(item)"
          :class="styles.search.item"
        >
          {{ item.label }}
        </div>
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
import { InputExtended } from "../input-extended";
import { Icon } from "../icon";

import type { SearchItem } from "./types";

import { useStyles, cn } from "../../utils";
import config from "./search.config";

import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    results: SearchItem[];
    placeholder?: string;
    minQueryLength?: number;
  }>(),
  {
    minQueryLength: 3,
  }
);

const emit = defineEmits(["update:search", "select"]);

const search = ref("");
const open = ref(false);

const meta = computed(() => ({
  isOpen: open.value && isValid.value,
}));

const styles = useStyles(["search"], meta, config, {}) as ComputedRef<{
  search: {
    container: string;
    input: string;
    inputContainer: string;
    icon: string;
    content: string;
    divider: string;
    item: string;
  };
}>;

const onSearch = (value: string | number) => {
  emit("update:search", value);
};

const onSelect = (item: SearchItem) => {
  search.value = "";
  emit("select", item);
};

const isValid = computed(() => {
  return search.value.length >= props.minQueryLength && !isEmpty(props.results);
});
</script>
