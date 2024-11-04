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
    v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
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

function maybeFocus([section]) {
  if (meta.value.shouldFocus && section.isIntersecting) {
    let el = section.target;
    if (
      !["input", "textarea", "select", "button"].includes(
        el.tagName.toLowerCase()
      )
    ) {
      el = el.querySelector("input");
    }
    if (el.getAttribute("tabindex")) {
      el.setAttribute("tabindex", -1);
    }
    el.focus();

    if (el && !el.closest('[aria-hidden="true"]')) {
      const selectableInputTypes = new Set([
        "text",
        "search",
        "url",
        "tel",
        "password",
        "email",
      ]);

      if (selectableInputTypes.has(el.type)) {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }
}

// --- lifecycle

// --- side effects
</script>
