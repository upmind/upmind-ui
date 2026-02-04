<template>
  <PopoverRoot v-model:open="open" tabindex="-1">
    <PopoverTrigger as-child>
      <FormControl
        :key="props.id"
        :disabled="props.disabled"
        :formItemId="`${props.id}-search`"
        :auto-focus="props.autoFocus"
        :placeholder="placeholder"
        :formDescriptionId="`search-${props.id}`"
        :formMessageId="`search-${props.id}`"
      >
        <Input
          v-model="search"
          type="text"
          width="full"
          @update:model-value="onSearch"
          @focus="onSearch(search)"
          :class="styles.search.inputContainer"
          :input-class="styles.search.input"
        />
      </FormControl>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent v-if="meta.isOpen" :class="styles.search.content">
        <li
          v-for="item in results"
          :key="item.id"
          @click="onSelect(item)"
          :class="styles.search.item"
        >
          {{ item.label }}
        </li>
        <li
          v-if="additionalOption"
          :class="styles.search.item"
          class="font-normal"
          @click="
            onSelect({
              id: 'additional',
              label: additionalOption
            } as SearchItem)
          "
        >
          {{ additionalOption }}
        </li>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
// --- external
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal
} from "radix-vue";
import { ref, computed, watch } from "vue";
// --- components
import { FormControl } from "../form";
import Input from "../input/Input.ce.vue";
// --- utils
import config from "./search.config";
import { useStyles } from "../../utils";
// --- types
import { uniqueId } from "lodash-es";
import type { SearchItem } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    id?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    results: SearchItem[] | null;
    placeholder?: string;
    minQueryLength?: number;
    icon?: string;
    additionalOption?: string;
  }>(),
  {
    id: uniqueId("search-"),
    results: null,
    minQueryLength: 3,
    additionalOption: "Enter manually"
  }
);

const emit = defineEmits(["update:search", "select"]);

const search = ref("");
const open = ref(false);

const meta = computed(() => ({
  isOpen: open.value && isValid.value
}));

const styles = useStyles(["search"], meta, config, {});

const onSearch = (value: string | number) => {
  emit("update:search", value);
};

const onSelect = (item: SearchItem) => {
  search.value = "";
  emit("select", item);
};

const isValid = computed(() => {
  return search.value.length >= props.minQueryLength && props.results !== null;
});

watch(
  () => props.results,
  () => {
    open.value = true;
  },
  { deep: true }
);
</script>
