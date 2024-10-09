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
    v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from "vue";
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
const target = ref<HTMLObjectElement | null>(null);

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
watchEffect(() => {
  // if (props.autofocus && target.value) {
  //   target.value.focus();
  // }

  target.value?.$el?.setCustomValidity(props.invalid ? "Invalid" : "");
});
</script>
