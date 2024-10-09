<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="props.variant"
          :color="props.color"
          :loading="props.loading"
          :class="cn(variants.combobox.trigger, props.class)"
          :size="props.size"
          :aria-expanded="open"
        >
          <template #prepend>
            <Avatar
              v-if="value?.avatar || props.avatar"
              v-bind="value?.avatar ? value.avatar : props?.avatar"
              size="3xs"
              shape="circle"
              fit="cover"
              aria-hidden="true"
            />
            <Icon
              v-if="value?.icon || props.icon"
              :icon="value?.icon ? value.icon : props?.icon"
              shape="circle"
              size="3xs"
              fit="cover"
              aria-hidden="true"
            />
          </template>

          <span class="flex flex-col justify-start gap-y-2 text-left">
            <span
              v-if="value?.label || props?.label"
              class="truncate leading-none"
            >
              {{ value?.label || props.label }}
            </span>

            <span
              v-if="value?.sublabel || props?.sublabel"
              class="leading-none opacity-50"
            >
              {{ value?.sublabel || props.sublabel }}
            </span>

            <span v-if="value?.tag || props?.tag" class="flex flex-wrap">
              <Badge
                class="text-center font-bold leading-none"
                :color="props.color"
                variant="tonal"
                size="xs"
              >
                {{ value?.tag || props.tag }}
              </Badge>
            </span>
          </span>

          <template #append>
            <Icon
              v-if="!props.loading"
              size="2xs"
              class="ml-auto rotate-180 opacity-50 transition-all duration-200"
              icon="arrow-up"
            />
          </template>
        </Button>
      </slot>
    </PopoverTrigger>

    <PopoverContent
      :align="align"
      :class="cn(variants.combobox.content, props.popoverClass)"
    >
      <Command>
        <template v-if="props.searchable">
          <CommandInput auto-focus :placeholder="searchMessage" />
          <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
        </template>
        <CommandList class="w-full max-w-full">
          <CommandGroup>
            <CommandItem
              v-for="item in items"
              :key="item.value"
              :value="item.value"
              @select="doSelect(item)"
              class="group flex cursor-pointer items-center justify-start gap-4"
              :class="variants.combobox.item"
            >
              <Avatar v-if="item.avatar" v-bind="item.avatar" size="3xs" />
              <Icon v-if="item.icon" :icon="item.icon" size="3xs" />
              <span v-if="item.label" class="leading-none">{{
                item.label
              }}</span>

              <Icon
                icon="check"
                size="3xs"
                :class="
                  cn(
                    'ml-auto',
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
import Badge from "../badge/Badge.ce.vue";
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
import type { ComboboxProps, ComboboxItemProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<ComboboxProps>(), {
  // --- props
  label: "",
  items: () => [],
  modelValue: "",
  loading: false,
  searchable: false,
  emptyMessage: "No Results",
  searchMessage: "Search...",
  // -- variants
  color: "base",
  size: "md",
  width: "xl",
  variant: "control",
  align: "end",
  // ---
  icon: "",

  // --- styles
  upwindConfig: () => ({ combobox: {} }),
  class: "",
  popoverClass: "",
});

const emit = defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  width: props.width,
}));

const open = ref(false);
const value = ref();

// ---

const variants = useStyles(
  ["combobox"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  combobox: { trigger: string; content: string; item: string };
}>;

// --- methods
const doSelect = (item: String | ComboboxItemProps) => {
  const selected = isString(item) ? find(props.items, { value: item }) : item;
  const hasChanged = selected !== value.value;

  // Use the ref value
  if (hasChanged) {
    value.value = selected;
    emit("update:modelValue", item); // Use the emit function directly
  }
  // finnaly close the popover
  open.value = false;
};

// --- side effect
doSelect(props.modelValue);
watch(() => props.modelValue, doSelect, { immediate: true });
</script>
