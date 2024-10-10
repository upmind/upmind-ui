<template>
  <div ref="control">
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
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef, watchEffect } from "vue";
import { vIntersectionObserver } from "@vueuse/components";
import { Slot } from "radix-vue";
import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  autofocus?: boolean;
  invalid?: boolean;
}>();

// --- state
const target = useTemplateRef("control");
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
  if (target.value) {
    // NB Radix Slot component is a wrapper and the ref is on the inner element
    // const el: HTMLElement = target.value;
    // const input: HTMLInputElement = el.querySelector(
    //   "input, textarea, select, [role='checkbox']"
    // ) as HTMLInputElement;
    // console.log("FormControl input", input);
    // if (props.autofocus && target.value) {
    //   target.value.focus();
    // }
    // if (isFunction(input?.setCustomValidity)) {
    //   console.log("FormControl", "setCustomValidity", props.invalid);
    //   input.setCustomValidity(props.invalid ? "Invalid" : "");
    // } else {
    //   console.warn(
    //     "FormControl element does not support setCustomValidity",
    //     input
    //   );
    // }
  }
});
</script>
