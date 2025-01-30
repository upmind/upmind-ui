<template>
  <span :class="styles.select.group">
    <DropdownMenuRoot v-model:open="open" tabindex="-1">
      <DropdownMenuTrigger as-child :disabled="disabled">
        <TriggerButton
          :class="props.class"
          :label="props.label"
          :loading="props.loading"
          :name="name"
          :open="open"
          :overrideIndex="overrideIndex"
          :placeholder="props.placeholder"
          :selected="selected"
          :size="props.size"
          :useInputGroup="props.useInputGroup"
          @keydown.prevent.enter="keyEnter"
          focusable
        >
          <template #item="{ item }">
            <slot name="item" :item="item"></slot>
          </template>
          <template #placeholder>
            <slot name="placeholder"></slot>
          </template>
        </TriggerButton>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
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
            <Label
              :for="`${name}-${(overrideIndex || 0) + index || index}`"
              :class="cn(styles.select.label)"
            >
              <slot name="dropdown-item" v-bind="{ item, index }">
                {{ item.label }}
              </slot>
            </Label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </span>
</template>

<script setup lang="ts">
// --- external
import { first } from "lodash-es";
import { ref } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

// --- internal
import { useSelectCards } from "./utils/useSelectCards";
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import TriggerButton from "./components/TriggerButton.vue";
import { Label } from "../label";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "radix-vue";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<SelectCardsProps>();

const emits = defineEmits(["update:modelValue"]);
const itemRefs = ref<HTMLElement[]>([]);

const { modelValue, open, onChange, selected, meta, keyEnter } = useSelectCards(
  props,
  emits,
  itemRefs
);

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    label: string;
    content: string;
    group: string;
  };
}>;

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
