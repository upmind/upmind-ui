<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        color="primary"
        :aria-expanded="open"
        :loading="loading"
        :class="cn(variants.combobox.button, props.class)"
        :label="value?.label || label"
      >
        <template #prepend>
          <Avatar
            v-if="value?.avatar"
            v-bind="value.avatar"
            size="3xs"
            shape="circle"
            fit="cover"
            aria-hidden="true"
          />
          <Icon
            v-if="value?.icon"
            :icon="value.icon"
            shape="circle"
            size="3xs"
            fit="cover"
            aria-hidden="true"
          />
        </template>

        <!-- <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" /> -->
        <template #append>
          <Icon
            class="rotate-180 bg-transparent bg-opacity-0 opacity-50 transition-all duration-200"
            icon="arrow-up"
            size="xs"
          />
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      :class="
        cn(
          variants.combobox.content,
          props.popoverClass ? props.popoverClass : props.class
        )
      "
    >
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
              :class="variants.combobox.item"
            >
              <div class="items center flex gap-2">
                <Avatar v-if="item.avatar" v-bind="item.avatar" size="3xs" />
                <Icon v-if="item.icon" :icon="item.icon" size="3xs" />
                <span>{{ item.label }}</span>
              </div>

              <Icon
                icon="check"
                size="3xs"
                :class="
                  cn(value?.value === item.value ? 'opacity-100' : 'opacity-0')
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
  upwindConfig: () => ({ combobox: {} }),
  class: "",
  popoverClass: "",
});

const emit = defineEmits(["update:modelValue", "input"]);

const meta = computed(() => ({
  color: props.color,
  width: props.width,
}));

const variants = useStyles(
  ["combobox"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  combobox: { content: string; button: string; item: string };
}>;

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
};
</script>
