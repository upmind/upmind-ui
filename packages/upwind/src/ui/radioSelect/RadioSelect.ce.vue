<template>
  <Collapsible v-model:open="open">
    <CollapsibleTrigger class="group w-full">
      <Button
        :color="props.color"
        :variant="props.variant"
        :class="cn(variants.radioSelect.trigger, props.class)"
        block
      >
        <template #prepend>
          <Avatar
            v-if="selected?.avatar || props.avatar"
            v-bind="selected?.avatar ? value.avatar : props?.avatar"
            size="3xs"
            shape="circle"
            fit="cover"
            aria-hidden="true"
          />
          <Icon
            v-if="selected?.icon || props.icon"
            :icon="selected?.icon ? value.icon : props?.icon"
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
          <span v-if="selected" class="flex flex-col md:gap-y-0">
            <span v-if="selected?.label || props?.label" class="mb-1">
              {{ selected?.label || props.label }}
            </span>

            <span
              v-if="selected?.text || props?.text"
              class="whitespace-normal leading-tight opacity-50"
            >
              {{ selected?.text || props.text }}
            </span>
          </span>

          <span v-else class="text-sm opacity-50">
            {{ props.placeholder || "Select an option" }}
          </span>

          <span
            v-if="selected?.badge || props?.badge"
            class="flex md:items-center md:space-x-4"
          >
            <Badge
              class="!m-0 !p-0 font-bold md:text-center"
              :color="props.color"
              size="xs"
            >
              {{ selected?.badge || props.badge }}
            </Badge>
          </span>
        </span>

        <template #append>
          <Icon
            class="opacity-50 transition-all duration-300 group-hover:opacity-100"
            :class="{ 'rotate-180': !open }"
            icon="arrow-up"
            size="xs"
          />
        </template>
      </Button>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <RadioGroup
        v-model="modelValue"
        :default-value="defaultValue"
        :class="variants.radioSelect.items"
        @update:model-value="open = !open"
      >
        <div
          :class="variants.radioSelect.item"
          v-for="(item, index) in itemsList"
          :key="`${props.name}-${index}`"
        >
          <RadioGroupItem
            :id="`${props.name}-${index}`"
            :value="item.value"
            :name="props.name"
            :class="variants.radioSelect.input"
          />

          <Label
            :for="`${props.name}-${index}`"
            :class="cn(variants.radioSelect.label, props.classLabel)"
          >
            <span
              class="flex w-full flex-col items-start justify-start text-left text-sm md:flex-row md:justify-between md:space-x-4 md:space-y-0"
              :class="variants.radioSelect.content"
            >
              <span class="flex w-full flex-col items-start">
                <h5 v-if="item?.label" class="m-0 block">
                  {{ item?.label }}
                </h5>

                <p
                  v-if="item?.text"
                  class="m-0 block whitespace-normal leading-tight opacity-50"
                >
                  {{ item?.text }}
                </p>

                <span class="flex items-center space-x-4 pr-2 md:hidden">
                  <Badge
                    class="text-center font-bold"
                    :color="props.color"
                    variant="tonal"
                    size="xs"
                  >
                    {{ item?.badge }}
                  </Badge>
                </span>
              </span>

              <Badge
                class="text-center font-bold"
                :color="props.color"
                variant="tonal"
                size="xs"
              >
                {{ item?.badge }}
              </Badge>
            </span>
          </Label>
        </div>
      </RadioGroup>

      <!-- <Button
        v-for="(item, index) in itemsList"
        :key="`${props.name}-${index}`"
        variant="control"
        :color="props.color"
        :class="cn(variants.radioSelect.trigger, props.class)"
        class="border-t-0 !border-opacity-75"
        @click="doSelect(item)"
      > -->

      <!-- </Button> -->
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
// ---external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

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
import { RadioGroup, RadioGroupItem } from "../radio-group";

// --- utils
import { find } from "lodash-es";

// --- types
import type { RadioSelectProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioSelectProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  noneText: "None",
  // -- variants
  color: "base",
  variant: "control",
  // --- styles
  class: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const open = ref(false);

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
  if (!props.required && modelValue.value) {
    return [...props.items, { value: null, label: props.noneText }];
  }
  return props.items;
});

const selected = computed(() => find(props.items, { value: modelValue.value }));
</script>
