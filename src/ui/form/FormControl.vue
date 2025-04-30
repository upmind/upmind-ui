<template>
  <Slot
    ref="slotElement"
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    class="w-full"
    v-bind="attributesToRemove"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useIntersectionObserver } from "@vueuse/core"; // or '@vueuse/integrations' in some setups
import { Slot } from "radix-vue";

import type { ComponentPublicInstance } from "vue";
const hasFocused = ref(false);

const props = defineProps<{
  formItemId: string;
  formDescriptionId?: string;
  formMessageId?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  animationDelay?: number;
}>();

// NB its important to remove some attributes that we use, but that ALSO have HTML attributes that dont correspond
// eg: autofocus >  as we are controlling it via the intersection observer
//                  and we DONT want the normal browser behaviour of scrolling to the element

const attributesToRemove = {
  autofocus: undefined,
  size: undefined,
};
// --- state

// --- computed

const meta = computed(() => ({
  isInvalid: !!props.invalid,
  shouldFocus: !!props.autoFocus && !hasFocused.value,
}));

const slotElement = ref<ComponentPublicInstance | null>(null);

function maybeFocus(entries: IntersectionObserverEntry[]) {
  const section = entries[0];
  if (meta.value.shouldFocus && section.isIntersecting) {
    let el = section.target as HTMLInputElement;

    // First check if the element itself is a focusable element
    if (
      !["input", "textarea", "select", "button"].includes(
        el.tagName.toLowerCase()
      )
    ) {
      // If not, try to find any focusable element inside
      const focusableElements = el.querySelectorAll(
        "input, textarea, select, button"
      );

      // Use the first focusable element found
      if (focusableElements.length > 0) {
        el = focusableElements[0] as HTMLInputElement;
      }
    }

    if (el?.getAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }

    // only focus if we have not already focused
    if (el) {
      el.focus();
      hasFocused.value = true;
    }

    // Prevents focusing on hidden elements
    if (!el?.closest('[aria-hidden="true"]')) {
      // Ensure element is an instance of HTMLInputElement
      if (el instanceof HTMLInputElement) {
        // Not all inputs support setSelectionRange. which are are using below to place the cursor
        const selectableInputTypes = new Set([
          "text",
          "search",
          "url",
          "tel",
          "password",
        ]);

        if (selectableInputTypes.has(el.type)) {
          // Pass through to setSelectionRange where to place the cursor, otherwise it will highlight the entire input
          // Most likely scenario is that we want the cursor at the end of the input
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
    }
  }
}

if (meta.value.shouldFocus) {
  debugger;
  watch(
    () => slotElement.value,
    async el => {
      if (el?.$el && isSelectable(el.$el)) {
        if (props.animationDelay) {
          await new Promise(resolve =>
            setTimeout(resolve, props.animationDelay! + 10)
          );
        }

        useIntersectionObserver(el, entries => maybeFocus(entries));
      }
    }
  );
}

const isSelectable = (element: HTMLElement) => {
  const selectableTypes = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

  const tag = element?.tagName?.toUpperCase();
  const isFocusableTag = selectableTypes.has(tag);

  const hasFocusableChildren =
    element &&
    typeof element?.querySelector === "function" &&
    element?.querySelector("input, textarea, select, button") !== null;

  return isFocusableTag || hasFocusableChildren;
};
</script>
