<template>
  <Slot
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    :autofocus="undefined"
    class="w-full"
    v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

// NB its important to NOT set autofocus as we are controlling it via the intersection observer
// and we DONT want the normal browser behaviour of scrolling to the element

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

// --- state

// --- computed

const meta = computed(() => ({
  isInvalid: !!props.invalid,
  shouldFocus: !!props.autoFocus,
}));

// --- methods

function maybeFocus([section]) {
  console.log("FormControl", "maybeFocus", section);
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
  }
}

// --- lifecycle

watchEffect(() => {
  console.log("FormControl", "props", props);
});

// --- side effects
</script>
