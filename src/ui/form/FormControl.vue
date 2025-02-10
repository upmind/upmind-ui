<template>
  <Slot
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    class="w-full"
    v-bind="attributesToRemove"
    v-intersection-observer="maybeFocus"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

import { Slot } from "radix-vue";
// import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId?: string;
  formMessageId?: string;
  invalid?: boolean;
  autoFocus?: boolean;
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
  shouldFocus: !!props.autoFocus,
}));

// --- methods

function maybeFocus(entries: IntersectionObserverEntry[]) {
  const section = entries[0];
  if (meta.value.shouldFocus && section.isIntersecting) {
    let el = section.target as HTMLInputElement;
    if (
      !["input", "textarea", "select", "button"].includes(
        el.tagName.toLowerCase()
      )
    ) {
      el = el.querySelector("input") as HTMLInputElement;
    }
    if (el?.getAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }

    if (el) {
      el.focus();
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
</script>
