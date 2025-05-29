<template>
  <div :class="cn(styles.radioCards.root, props.class)">
    <Collapsible v-model:open="open">
      <div
        v-if="selectedItem"
        :class="styles.radioCards.item"
        data-state="checked"
      >
        <div :class="styles.radioCards.label">
          <div :class="styles.radioCards.radio">
            <input
              :id="`${props.name}-selected`"
              :name="props.name"
              :value="selectedItem.value"
              :required="props.required"
              :disabled="props.disabled"
              type="radio"
              checked
              :class="styles.radioCards.input"
              style="position: absolute; opacity: 0; pointer-events: none"
            />
          </div>
          <slot
            name="item"
            v-bind="{
              item: selectedItem,
            }"
          >
            <span v-if="selectedItem.label">{{ selectedItem.label }}</span>
          </slot>
        </div>
      </div>
      <CollapsibleContent class="mt-2">
        <component
          :is="useInputGroup ? RadioGroup : 'div'"
          :model-value="modelValue"
          :required="props.required"
          :disabled="props.disabled"
          data-testid="radio-card-group"
          @update:model-value="onSelectionChange"
        >
          <template
            v-for="(option, index) in unselectedItems"
            :key="option.id || index"
          >
            <RadioCardItem
              :item="option.item"
              :index="overrideIndex || index"
              :name="props.name"
              :label="option?.label"
              :required="props.required"
              :disabled="props.disabled"
              :model-value="modelValue"
              :width="props.width"
              :value="option.value"
              :class="props.radioClass"
              :list="props.list"
              data-testid="radio-card-item"
              :uiConfig="props.uiConfig"
              @keydown.enter="onSelectionChange(option.value)"
            >
              <template #item="slotProps">
                <slot name="item" v-bind="slotProps" />
              </template>
            </RadioCardItem>
          </template>
        </component>
      </CollapsibleContent>

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
