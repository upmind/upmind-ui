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
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
        focusable
      >
        <template #item="{ item }">
          <slot name="item" v-bind="item as SelectCardsItemProps">
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
        :align="props.align"
        @keydown="isKeyboardNav = true"
        @pointermove="isKeyboardNav = false"
      >
        <ScrollAreaRoot type="auto" :class="styles.select.items">
          <ScrollAreaViewport>
            <DropdownMenuItem
              v-for="(item, index) in items"
              :key="item.id || index"
              @click="onChange(item.value)"
              @focus="onHighlight(item.value)"
              :class="styles.select.item"
              v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
              :data-state="item.value === modelValue ? 'checked' : null"
            >
              <slot
                name="dropdown-item"
                v-bind="{ ...item, index } as SelectCardsItemProps"
              >
                <Item v-bind="item" />
              </slot>
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="$slots['additional-item']"
              :class="styles.select.item"
            >
              <slot name="additional-item" />
            </DropdownMenuItem>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar
            orientation="vertical"
            :class="styles.select.scrollbar"
          >
            <ScrollAreaThumb :class="styles.select.scrollbarThumb" />
          </ScrollAreaScrollbar>
        </ScrollAreaRoot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useVModel } from "@vueuse/core";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb
} from "radix-vue";
import { ref, computed } from "vue";
import Item from "./components/Item.vue";
import TriggerButton from "./components/TriggerButton.vue";
import config from "./selectCards.config";
import { cn, useStyles } from "../../utils";
import { first, find } from "lodash-es";
import type { SelectCardsProps, SelectCardsItemProps } from "./types";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  required: true,
  placeholder: "Select an option",
  align: "start",
  size: "md"
});

const emits = defineEmits(["update:modelValue"]);

const open = ref(false);
const isKeyboardNav = ref(false);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const selected = computed(() => find(props.items, { value: modelValue.value }));

const meta = computed(() => ({
  width: props.width,
  size: props.size
}));

const styles = useStyles(["select"], meta, config, props.uiConfig ?? {});

function onChange(value: any) {
  if (!props.required && modelValue.value === value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
  open.value = false;
}

function onHighlight(value: any) {
  if (isKeyboardNav.value && value !== undefined) {
    modelValue.value = value;
  }
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
