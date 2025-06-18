<template>
  <div :class="cn(styles.radioCards.root, props.class)">
    <Collapsible v-model:open="open">
      <RadioGroup
        :model-value="modelValue"
        :required="props.required"
        :disabled="props.disabled"
        data-testid="radio-card-group"
        @update:model-value="onSelectionChange"
        class="flex w-full flex-col gap-0"
      >
        <RadioCardItem
          v-if="selectedItem"
          data-state="checked"
          :item="selectedItem.item"
          :index="0"
          :name="props.name"
          :label="selectedItem?.label"
          :required="props.required"
          :disabled="props.disabled"
          :model-value="modelValue"
          :width="props.width"
          :value="selectedItem.value"
          :list="props.list"
          :minimal="props.minimal"
          data-testid="radio-card-item"
          :uiConfig="selectedItemUiConfig"
        >
          <template #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </RadioCardItem>

        <template v-else>
          <Skeleton>
            <RadioCardItem
              :item="{
                title: 'Loading...',
                description: 'Loading...',
              }"
              :index="-1"
              :model-value="modelValue"
              value="-1"
            >
              <template #item="slotProps">
                <slot name="item" v-bind="slotProps" />
              </template>
            </RadioCardItem>
          </Skeleton>
        </template>

        <CollapsibleContent class="flex w-full flex-col overflow-visible">
          <template
            v-for="(option, index) in unselectedItems"
            :key="option.id || index"
          >
            <RadioCardItem
              class="mt-2"
              :item="option.item"
              :index="index + 1"
              :name="props.name"
              :label="option?.label"
              :required="props.required"
              :disabled="props.disabled"
              :model-value="modelValue"
              :width="props.width"
              :value="option.value"
              :class="props.radioClass"
              :list="props.list"
              :minimal="props.minimal"
              data-testid="radio-card-item"
              :uiConfig="props.uiConfig"
              @keydown.enter="onSelectionChange(option.value)"
            >
              <template #item="slotProps">
                <slot name="item" v-bind="slotProps" />
              </template>
            </RadioCardItem>
          </template>
        </CollapsibleContent>
      </RadioGroup>

      <slot name="actions">
        <Link
          :label="label"
          size="sm"
          variant="muted"
          :disabled="props.disabled"
          @click="toggleExpanded"
        />
      </slot>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup } from "../radio-group";
import { Collapsible, CollapsibleContent } from "../collapsible";
import { Link } from "../link";
import { Skeleton } from "../skeleton";
import RadioCardItem from "./RadioCardItem.vue";

// --- types
import type { RadioCardsCollapsibleProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioCardsCollapsibleProps>(), {
  // --- props
  placeholder: "Select an option",
  overrideIndex: 0,
  useInputGroup: true,
  label: "Change",
  autoCollapse: true,
  // -- variants
  width: 12,
  list: false,
  // --- styles
  class: "",
  radioClass: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const open = useVModel(props, "open", emits, {
  passive: true,
  defaultValue: props.open,
});

const meta = computed(() => ({
  isList: props.list,
  isMinimal: props.minimal,
  width: props.width,
}));

const styles = useStyles(
  "radioCards",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    radio: string;
    input: string;
    label: string;
  };
}>;

const selectedItem = computed(() => {
  return props.items.find(item => item.value === modelValue.value);
});

const unselectedItems = computed(() => {
  return props.items.filter(item => item.value !== modelValue.value);
});

const selectedItemUiConfig = {
  radioCards: {
    input:
      "!outline-none !ring-0 focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0 focus-visible:!outline-none focus-visible:ring-0 !ring-0",
    item: "!outline-none !ring-0 focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 !ring-0",
  } as any,
};

const toggleExpanded = () => {
  open.value = !open.value;
};

const onSelectionChange = (value: any) => {
  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }

  if (props.autoCollapse && value !== undefined) {
    open.value = false;
  }
};
</script>
