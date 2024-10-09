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
            v-if="value?.badge || props?.badge"
            class="flex items-center space-x-4"
          >
            <Badge
              class="text-center font-bold leading-none"
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
    <div v-auto-animate>
      <div v-if="isOpen">
        <Button
          v-for="(item, index) in props.items"
          :key="`radio-select-item-${index}`"
          variant="control"
          :color="props.color"
          block
          class="m-0 h-14 border-t-0 !border-opacity-75"
          @click="doSelect(item)"
        >
          <span
            class="flex w-full flex-row items-center justify-between space-x-4 text-left"
            :class="variants.radioSelect.content"
          >
            <span class="flex flex-row items-center space-x-1">
              <span>
                <UpwCheckbox :model-value="item.value === value?.value" />
              </span>
              <span class="flex flex-col gap-y-1">
                <span v-if="item?.label" class="truncate leading-none">
                  {{ item?.label }}
                </span>

                <span v-if="item?.sublabel" class="leading-none opacity-50">
                  {{ item?.sublabel }}
                </span>
              </span>
            </span>

            <span class="flex items-center space-x-4 pr-2">
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
      </div>
    </div>
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
import UpwCheckbox from "../../components/checkbox/Checkbox.vue";

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
const doSelect = (item: String | RadioSelectItem) => {
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
