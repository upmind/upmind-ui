<template>
  <DropdownMenuRoot v-model:open="open" tabindex="-1">
    <DropdownMenuTrigger
      as-child
      :disabled="disabled"
      :class="styles.select.trigger"
    >
      <TriggerButton
        :open="open"
        :selected="selected"
        :class="props.class"
        :label="props.label"
        :loading="props.loading"
        :placeholder="props.placeholder"
        focusable
      >
        <template #item="{ item }: { item: SelectCardsItemProps }">
          <slot name="item" :item="item">
            <Item v-bind="item" />
          </slot>
        </template>
        <template #placeholder>
          <slot name="placeholder"></slot>
        </template>
      </TriggerButton>
    </DropdownMenuTrigger>

    <DropdownMenuPortal :to="props.to">
      <DropdownMenuContent
        :class="cn(styles.select.content, props.contentClass)"
      >
        <DropdownMenuItem
          v-for="(item, index) in items"
          :key="item.id || index"
          @click="onChange(item.value)"
          :class="styles.select.item"
          v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
          :data-state="item.value === modelValue ? 'checked' : null"
        >
          <slot name="dropdown-item" v-bind="{ item, index }">
            <Item v-bind="item" />
          </slot>
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="$slots['additional-item']"
          :class="styles.select.item"
        >
          <slot name="additional-item" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
// --- external
import { first, find } from "lodash-es";
import { useVModel } from "@vueuse/core";
import { ref, computed, useSlots } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import TriggerButton from "./components/TriggerButton.vue";
import Item from "./components/Item.vue";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger
} from "radix-vue";

// --- types
import type { SelectCardsProps, SelectCardsItemProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  required: true
});

const emits = defineEmits(["update:modelValue"]);

const open = ref(false);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const selected = computed(() => find(props.items, { value: modelValue.value }));

const meta = computed(() => ({
  width: props.width
}));

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    content: string;
    group: string;
    trigger: string;
  };
}>;

function onChange(value: any) {
  if (!props.required && modelValue.value === value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
  open.value = false;
}

function maybeFocus([section]: IntersectionObserverEntry[]) {
  if (section?.isIntersecting) {
    let el = section.target;
    if (el && (el as HTMLElement).dataset.state === "checked") {
      (el as HTMLElement).focus();
    }
  }
}

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}
</script>
