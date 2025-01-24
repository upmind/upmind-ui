<template>
  <component
    :is="meta.isCollapsible ? Collapsible : DropdownMenuRoot"
    v-model:open="open"
    :disabled="disabled"
    class="w-full"
    tabindex="-1"
  >
    <component
      :is="radio && useInputGroup ? RadioGroup : 'div'"
      :disabled="disabled"
      :model-value="modelValue"
      :default-value="defaultValue"
      @update:model-value="onChange"
      :class="variants.select.group"
      tabindex="-1"
    >
      <component
        :is="meta.isCollapsible ? CollapsibleTrigger : DropdownMenuTrigger"
        as-child
        @keydown.prevent.arrow-down="keyArrowDown"
        @keydown.prevent.arrow-up="keyArrowUp"
      >
        <Button
          :id="`${name}-${overrideIndex}`"
          :loading="loading"
          :class="cn(variants.select.trigger, props.class)"
          :size="size"
          :aria-expanded="open"
          variant="control"
          block
          :tabindex="useInputGroup ? 0 : -1"
          @focus="handleFocus"
          @keydown.prevent.enter="keyEnter"
        >
          <span v-if="radio" class="flex h-full items-start">
            <RadioGroupItem
              ref="focusRoot"
              :id="
                manuallySelected ? manuallySelected.value : first(items)?.value
              "
              :value="
                manuallySelected ? manuallySelected.value : first(items)?.value
              "
              :name="props.name"
              :required="props.required"
              :disabled="props.disabled"
              class="mt-1"
              @focus="handleFocus"
              @blur="handleBlur"
            />
          </span>

          <slot v-if="selected" name="item" v-bind="{ item: selected }">
            {{ selected?.label || label }}
          </slot>

          <slot v-if="!selected" name="placeholder" v-bind="{ item: selected }">
            <span class="opacity-50">
              <slot name="placeholder">{{ placeholder }}</slot>
            </span>
          </slot>

          <template #append>
            <Icon
              class="ml-auto opacity-75 transition-all duration-200"
              :class="open ? 'rotate-180' : ''"
              icon="arrow-down"
              size="xs"
            />
          </template>
        </Button>
      </component>

      <component :is="meta.isCollapsible ? 'div' : DropdownMenuPortal">
        <component
          :is="meta.isCollapsible ? CollapsibleContent : DropdownMenuContent"
          :class="cn(variants.select.content, props.contentClass)"
          :onOpenAutoFocus="handleOpenAutoFocus"
        >
          <component
            v-for="(item, index) in items"
            :key="item.id || index"
            :is="meta.isCollapsible ? 'div' : DropdownMenuItem"
            :class="variants.select.item"
            tabindex="0"
            @click="onChange(item.value)"
            @keydown.prevent.arrow-down="focusNextItem(index)"
            @keydown.prevent.arrow-up="focusPreviousItem(index)"
            @keydown.prevent.enter="
              onChange(item.value);
              focusRadio();
            "
            :ref="
              (el: HTMLElement) => {
                if (el) itemRefs[index] = el;
              }
            "
          >
            <Label
              :for="`${name}-${overrideIndex + index || index}`"
              :class="cn(variants.select.label)"
            >
              <slot name="dropdown-item" v-bind="{ item, index }">
                {{ item.label }}
              </slot>
            </Label>

            <!-- Required for the selector to work -->
            <RadioGroupItem
              v-if="radio"
              :id="`${name}-${overrideIndex + index || index}`"
              :value="item.value"
              :name="name"
              :required="required"
              :disabled="disabled"
              class="sr-only"
            />
          </component>
        </component>
      </component>
    </component>
  </component>
</template>

<script lang="ts" setup>
// ---external
import { ref, computed, watch, nextTick } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import { Icon } from "../icon";
import { Button } from "../button";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "radix-vue";

// --- utils
import { find, first, findIndex } from "lodash-es";
import { useFocus } from "@vueuse/core";
import { useFocusNavigation } from "../../utils/useFocusNavigation";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SelectCardsProps>(), {
  // --- props
  variant: "dropdown",
  loading: false,
  placeholder: "Select an option",
  required: false,
  overrideIndex: 0,
  useInputGroup: true,
  // -- variants
  width: "full",
  separate: false,
  // --- styles
  class: "",
  contentClass: "",
});

const meta = computed(() => ({
  variant: props.variant,
  isCollapsible: props.variant === "collapsible",
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: {
    root: string;
    trigger: string;
    items: string;
    item: string;
    input: string;
    label: string;
    group: string;
    content: string;
  };
}>;

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const open = ref(false);
const selected = computed(() => find(props.items, { value: modelValue.value }));
const focusedElement = ref<HTMLElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
const focusRoot = ref<HTMLElement | null>(null);

watch(
  () => props.disabled,
  isDisabled => {
    if (!isDisabled && focusedElement.value) {
      nextTick(() => {
        const { focused } = useFocus(focusedElement.value);
        focused.value = true;
      });
    }
  }
);

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}

const handleFocus = (event: FocusEvent) => {
  focusedElement.value = event.target as HTMLElement;
  if (!props.useInputGroup && !find(props.items, { value: modelValue.value })) {
    modelValue.value = first(props.items)?.value;
  }
};

const handleBlur = () => {
  if (!props.disabled) {
    focusedElement.value = null;
  }
};

const manuallySelected = computed(() => {
  return selected.value && selected.value !== first(props.items)
    ? selected.value
    : undefined;
});

function onChange(value: any) {
  if (!props.required && modelValue.value == value)
    modelValue.value = undefined;
  else modelValue.value = value;

  open.value = false;
}

const focusRadio = () => {
  if (focusRoot.value) {
    const { focused } = useFocus(focusRoot.value);
    focused.value = true;
  }
  open.value = false;
};

const { focusFirstItem, focusLastItem, focusNextItem, focusPreviousItem } =
  useFocusNavigation(itemRefs, focusRadio);

const handleOpenAutoFocus = (event?: Event) => {
  event?.preventDefault();
  // Wait for the next frame to focus the item (avoids race condition)
  // nextTick doesn't guarantee portal tasks have settled
  requestAnimationFrame(() => {
    const selectedItem = findIndex(
      props.items,
      item => item.value === modelValue.value
    );
    const index = selectedItem >= 0 ? selectedItem : 0;
    if (itemRefs.value[index]) {
      const { focused } = useFocus(itemRefs.value[index]);
      focused.value = true;
    }
  });
};

const keyEnter = () => {
  if (meta.value.isCollapsible) open.value = !open.value;
  handleOpenAutoFocus();
};

const keyArrowDown = () => {
  if (props.useInputGroup) {
    open.value = true;
    focusFirstItem();
  }
};

const keyArrowUp = () => {
  if (props.useInputGroup) {
    open.value = true;
    focusLastItem();
  }
};
</script>
