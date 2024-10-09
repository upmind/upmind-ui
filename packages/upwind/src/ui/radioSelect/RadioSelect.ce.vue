<template>
  <Collapsible v-model:open="isOpen">
    <CollapsibleTrigger class="group w-full">
      <Button
        :color="props.color"
        :variant="props.variant"
        :class="cn(variants.radioSelect.trigger, props.class)"
        block
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

        <span
          class="flex w-full flex-row items-center justify-between space-x-4 text-left"
          :class="variants.radioSelect.content"
        >
          <span class="flex flex-col gap-y-1">
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
          </span>

          <span
            v-if="value?.tag || props?.tag"
            class="flex items-center space-x-4"
          >
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
            class="opacity-50 transition-all duration-300 group-hover:opacity-100"
            :class="{ 'rotate-180': !isOpen }"
            icon="arrow-down"
            size="xs"
          />
        </template>
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      Yes. Free to use for personal and commercial projects. No attribution
      required.
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
// ---external
import { watch, ref, computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioSelect.config";

// --- components
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { Button } from "../button";
import { Icon } from "../icon";

// --- utils
import { find, isString } from "lodash-es";

// --- types
import type { RadioSelectProps, RadioSelectItemProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioSelectProps>(), {
  // --- props
  label: "",
  modelValue: "",
  loading: false,
  // -- variants
  color: "base",
  variant: "control",
  // --- styles
  class: "",
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const value: any = ref();

const meta = computed(() => ({
  color: props.color,
  width: props.width,
}));

const variants = useStyles(
  ["radioSelect"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioSelect: { trigger: string; content: string };
}>;

// --- methods
const doSelect = (item: String | RadioSelectItemProps) => {
  const selected = isString(item) ? find(props.items, { value: item }) : item;
  const hasChanged = selected?.value !== value.value;

  // Use the ref value
  if (hasChanged) {
    value.value = selected;
    emit("update:modelValue", item); // Use the emit function directly
  }
  // finnaly close the popover
  isOpen.value = false;
};

// --- side effect
doSelect(props.modelValue);
watch(() => props.modelValue, doSelect, { immediate: true });
</script>
