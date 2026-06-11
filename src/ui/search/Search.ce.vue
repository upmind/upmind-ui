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
          v-model="searchValue"
          type="text"
          width="full"
          :class="styles.search.inputContainer"
          :input-class="styles.search.input"
          @update:model-value="onSearch"
          @focus="onSearch(searchValue)"
        >
          <template v-if="$slots.append" #append>
            <slot name="append" />
          </template>
        </Input>
      </FormControl>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent v-if="meta.isOpen" :class="styles.search.content">
        <li
          v-for="item in results"
          :key="item.id"
          :class="styles.search.item"
          @click="onSelect(item)"
        >
          {{ item.label }}
        </li>
        <li
          v-if="additionalOption"
          :class="styles.search.additionalItem"
          @click="onSelectAdditional"
        >
          {{ additionalOption }}
        </li>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module search/Search
 * @description Searchable popover input with result selection.
 */

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
import { uniqueId } from "lodash-es";
// --- types
import type { SearchItem } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    id?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    modelValue?: string;
    /** `null` = no search performed yet, `[]` = search returned no results. */
    results: SearchItem[] | null;
    placeholder?: string;
    minQueryLength?: number;
    icon?: string;
    additionalOption?: string;
  }>(),
  {
    id: uniqueId("search-"),
    results: null,
    minQueryLength: 3
  }
);

const emit = defineEmits<{
  "update:search": [value: string];
  "update:modelValue": [value: string];
  select: [item: SearchItem];
}>();

// --- state

const internalSearch = ref("");
const open = ref(false);

// --- computed

const hasModelValue = computed(() => props.modelValue !== undefined);

const searchValue = computed({
  get: () => (hasModelValue.value ? props.modelValue! : internalSearch.value),
  set: (value: string) => {
    if (hasModelValue.value) {
      emit("update:modelValue", value);
    } else {
      internalSearch.value = value;
    }
  }
});

const isValid = computed(
  () =>
    searchValue.value.length >= props.minQueryLength && props.results !== null
);

const meta = computed(() => ({
  isOpen: open.value && isValid.value
}));

const styles = useStyles(["search"], meta, config, {});

// --- methods

const onSearch = (value: string | number | undefined) => {
  if (value === undefined) return;
  emit("update:search", String(value));
};

const onSelect = (item: SearchItem) => {
  if (hasModelValue.value) {
    emit("update:modelValue", item.label);
  } else {
    internalSearch.value = "";
  }
  emit("select", item);
};

const onSelectAdditional = () => {
  if (!props.additionalOption) return;
  onSelect({ id: "additional", label: props.additionalOption });
};

// --- watchers

watch(
  () => props.results,
  () => {
    open.value = true;
  }
);
</script>
