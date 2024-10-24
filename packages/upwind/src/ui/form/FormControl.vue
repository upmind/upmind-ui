<template>
  <Slot
    ref="control"
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
    class="w-full"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { vIntersectionObserver } from "@vueuse/components";
import { Slot } from "radix-vue";
// import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  autoFocus?: boolean;
  invalid?: boolean;
}>();

// --- state
const target = useTemplateRef("control");
// --- computed

// --- methods
function maybeFocus([section]: IntersectionObserverEntry[]) {
  if (props.autoFocus && section.isIntersecting) {
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
