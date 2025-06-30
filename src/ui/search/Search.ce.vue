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
        <InputExtended
          v-model="search"
          type="text"
          width="full"
          @update:model-value="onSearch"
          @focus="onSearch(search)"
          :class="styles.search.inputContainer"
          :input-class="styles.search.input"
        >
          <template v-if="icon" #prepend>
            <Icon :icon="icon" :class="styles.search.icon" />
          </template>
        </InputExtended>
      </FormControl>
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
        <div
          v-if="additionalOption"
          :class="styles.search.item"
          @click="
            onSelect({
              id: 'additional',
              label: additionalOption
            } as SearchItem)
          "
        >
          {{ additionalOption }}
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
// --- external
import { ref, computed, watch } from "vue";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal
} from "radix-vue";

// --- components
import { FormControl } from "../form";
import { InputExtended } from "../input-extended";
import { Icon } from "../icon";

// --- utils
import { useStyles, cn } from "../../utils";
import config from "./search.config";

// --- types
import type { SearchItem } from "./types";
import type { ComputedRef } from "vue";
import { uniqueId } from "lodash-es";

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
