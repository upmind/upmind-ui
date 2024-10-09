<template>
  <Slot
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { vIntersectionObserver } from "@vueuse/components";
import { Slot } from "radix-vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  autofocus?: boolean;
  invalid?: boolean;
}>();

// --- state

// --- computed

// --- methods
function maybeFocus([section]: IntersectionObserverEntry[]) {
  if (props.autofocus && section.isIntersecting) {
    let el: HTMLElement = section.target as HTMLElement;
    if (
      !["input", "textarea", "select", "button"].includes(
        el.tagName.toLowerCase()
      )
    ) {
      el = el.querySelector("input") as HTMLElement;
    }
    if (el.getAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }
    el.focus();
  }
}

// --- lifecycle

// --- side effects
</script>
