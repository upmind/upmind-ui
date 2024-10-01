<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        color="primary"
        :aria-expanded="open"
        class="w-[200px] justify-between"
        :disabled="loading"
        :class="cn(variants.button, props.class)"
      >
        <span class="flex items-center truncate">
          <Avatar
            v-if="value?.icon"
            :icon="value.icon"
            size="xxxs"
            shape="circle"
            fit="cover"
            class="mr-2 shrink-0"
            aria-hidden="true"
          />
          <span>{{ value?.label || label }}</span>
        </span>

        <!-- <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" /> -->

        <Icon
          v-if="!loading"
          class="ml-2 h-4 w-4 shrink-0 rotate-180 opacity-50 transition-all duration-200"
          icon="arrow-up"
        />

        <UpwSpinner
          size="xs"
          v-else
          class="-mr-1 ml-2 mt-1 shrink-0 opacity-50"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent :class="cn(variants.content, props.class)">
      <Command>
        <CommandInput auto-focus :placeholder="searchMessage" />
        <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="item in items"
              :key="item.value"
              :value="item.value"
              @select="handleSelect(item)"
              class="group flex cursor-pointer items-center justify-between"
              :class="variants.item"
            >
              <div class="flex">
                <Avatar
                  v-if="item.icon"
                  :icon="item.icon"
                  size="xxxs"
                  class="mr-2"
                />
                <span class="mt-[1px] leading-none">{{ item.label }}</span>
              </div>

              <Icon
                icon="check"
                :class="
                  cn(
                    'h-3 w-3',
                    value?.value === item.value ? 'opacity-100' : 'opacity-0'
                  )
                "
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
// --- external
import { ref, watch, computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./combobox.config";

// --- components
import Button from "../button/Button.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
import Icon from "../icon/Icon.ce.vue";
import UpwSpinner from "../../components/spinner/Spinner.vue";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

// --- utils
import { find, isString } from "lodash-es";

// --- types
import type { ComboboxProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<ComboboxProps>(), {
  // --- props
  label: "",
  items: () => [],
  modelValue: "",
  loading: false,
  emptyMessage: "No Results",
  searchMessage: "Search...",
  // -- variants
  color: "base",
  width: "md",
  // --- styles
  upwindConfig: () => ({ alert: {} }),
  class: "",
});

const emit = defineEmits(["update:modelValue", "input"]);

const meta = computed(() => ({
  color: props.color,
  width: props.width,
}));

const variants = useStyles(
  ["button", "content", "item"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ content: string; button: string; item: string }>;

const open = ref(false);
const selected = isString(props.modelValue)
  ? find(props.items, { value: props.modelValue })
  : props.modelValue;
const value = ref(selected);

watch(
  () => props.modelValue,
  newValue => {
    const selected = isString(newValue)
      ? find(props.items, { value: newValue })
      : newValue;
    value.value = selected;
  },
  { immediate: true }
);

const handleSelect = (item: any) => {
  value.value = item; // Use the ref value
  open.value = false; // Use the ref value
  emit("update:modelValue", item); // Use the emit function directly
  emit("input", item); // Use the emit function directly
};
</script>
