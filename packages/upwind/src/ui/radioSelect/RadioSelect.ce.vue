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
          class="flex w-full flex-col items-start justify-start text-left text-sm md:flex-row md:items-center md:justify-between md:space-x-4 md:space-y-0"
          :class="variants.radioSelect.content"
        >
          <span
            v-if="value && value.label !== 'None'"
            class="flex flex-col md:gap-y-0"
          >
            <span v-if="value?.label || props?.label" class="mb-1 leading-none">
              {{ value?.label || props.label }}
            </span>

            <span
              v-if="value?.sublabel || props?.sublabel"
              class="mb-1 leading-none opacity-50"
            >
              {{ value?.sublabel || props.sublabel }}
            </span>
          </span>
          <span v-else class="text-sm opacity-50">
            {{ props.placeholder || "Select an option" }}
          </span>

          <span
            v-if="value?.badge || props?.badge"
            class="flex md:items-center md:space-x-4"
          >
            <Badge
              class="!m-0 !p-0 font-bold leading-none md:text-center"
              :color="props.color"
              size="xs"
            >
              {{ value?.badge || props.badge }}
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
    <CollapsibleContent v-auto-animate>
      <Button
        v-for="(item, index) in itemsList"
        :key="`radio-select-item-${index}`"
        variant="control"
        :color="props.color"
        :class="cn(variants.radioSelect.trigger, props.class)"
        class="border-t-0 !border-opacity-75"
        @click="doSelect(item)"
      >
        <span
          class="flex w-full flex-col items-start justify-start space-y-1 text-left text-sm md:flex-row md:items-center md:justify-between md:space-x-4 md:space-y-0"
          :class="variants.radioSelect.content"
        >
          <span class="flex flex-row items-center space-x-1">
            <span class="-ml-1">
              <UpwRadio :model-value="item.value === value?.value" />
            </span>
            <span class="flex flex-col">
              <span v-if="item?.label" class="mb-1 leading-none">
                {{ item?.label }}
              </span>

              <span v-if="item?.sublabel" class="mb-1 leading-none opacity-50">
                {{ item?.sublabel }}
              </span>

              <span class="flex items-center space-x-4 pr-2 md:hidden">
                <Badge
                  class="text-center font-bold leading-none"
                  :color="props.color"
                  variant="tonal"
                  size="xs"
                >
                  {{ item?.badge }}
                </Badge>
              </span>
            </span>
          </span>

          <span class="hidden items-center space-x-4 pr-2 md:flex">
            <Badge
              class="text-center font-bold leading-none"
              :color="props.color"
              variant="tonal"
              size="xs"
            >
              {{ item?.badge }}
            </Badge>
          </span>
        </span>
      </Button>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
// ---external
import { watch, ref, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

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
import UpwRadio from "../../components/radio/Radio.vue";

// --- utils
import { find, isString } from "lodash-es";

// --- types
import type { RadioSelectProps, RadioSelectItem } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioSelectProps>(), {
  // --- props
  label: "",
  modelValue: "",
  loading: false,
  placeholder: "Select an option",
  required: false,
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

const itemsList = computed(() => {
  if (!props.required && value.value) {
    return [...props.items, { value: null, label: "None" }];
  }
  return props.items;
});

// --- methods
const doSelect = (item: String | RadioSelectItem) => {
  const selected = isString(item) ? find(props.items, { value: item }) : item;
  const hasChanged = selected?.value !== value.value;

  if (hasChanged) {
    value.value = selected;
    emit("update:modelValue", item);
  }
  isOpen.value = false;
};

// --- side effect
doSelect(props.modelValue);
watch(() => props.modelValue, doSelect, { immediate: true });
</script>
