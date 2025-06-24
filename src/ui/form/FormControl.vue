<template>
  <Slot
    ref="target"
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
// --- external
import { ref, computed, watch } from "vue";
import { useIntersectionObserver } from "@vueuse/core"; // or '@vueuse/integrations' in some setups
import { Slot } from "radix-vue";

// --- utils
import { first, isEmpty, isFunction } from "lodash-es";

// --- types
import type { ComponentPublicInstance } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId?: string;
  formMessageId?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  animationDelay?: number;
}>();

// -----------------------------------------------------------------------------

// NB its important to remove some attributes that we use, but that ALSO have HTML attributes that dont correspond
// eg: autofocus >  as we are controlling it via the intersection observer
//                  and we DONT want the normal browser behaviour of scrolling to the element

const attributesToRemove = {
  autofocus: undefined,
  size: undefined,
};

// --- state

let observer: ReturnType<typeof useIntersectionObserver>;

const target = ref<ComponentPublicInstance | null>(null);

let animationCompleted = ref(false);

if (props.animationDelay) {
  new Promise(resolve => setTimeout(resolve, props.animationDelay! + 10)).then(
    () => {
      animationCompleted.value = true;
    }
  );
} else {
  animationCompleted.value = true;
}

// --- context

const focussable = ["input", "textarea", "select", "button"];

// --- computed

const meta = computed(() => ({
  isInvalid: !!props.invalid,
  shouldFocus: !!props.autoFocus && animationCompleted.value,
  isAnimationCompleted: animationCompleted.value,
}));

// --- methods

function isSelectable(element: HTMLElement) {
  const tag = element?.tagName?.toLowerCase();
  const isFocusableTag = focussable.includes(tag);
  const hasFocusableChildren =
    isFunction(element?.querySelector) &&
    element?.querySelector(focussable.join(", ")) !== null;

  return isFocusableTag || hasFocusableChildren;
}

function maybeFocus([section]: IntersectionObserverEntry[]) {
  // const section = entries[0];
  if (meta.value.shouldFocus && section.isIntersecting) {
    let el = section.target as HTMLInputElement;

    // ensure the element itself is focusable, or try to find the first focusable child element
    if (!focussable.includes(el.tagName.toLowerCase())) {
      const children = el.querySelectorAll(focussable.join(", "));
      el = first(children) as HTMLInputElement;
    }

    if (el?.getAttribute("tabindex")) el.setAttribute("tabindex", "-1");

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

    // Finally...if we have an element we can focus it and stop observing
    if (el) {
      el.focus();
      observer.stop();
    }
  }
}

const stop = watch(target, async el => {
  if (el?.$el && isSelectable(el.$el)) {
    observer ??= useIntersectionObserver(el, entries => maybeFocus(entries));
    stop();
  }
});
</script>
