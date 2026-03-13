<template>
  <FormField v-bind="formFieldProps" required :errors="allErrors">
    <Input
      :aria-invalid="hasErrors"
      :data-focus="isFocused"
      :disabled="appliedOptions?.disabled"
      :model-value="control.data"
      @update:modelValue="onInput"
    >
      <!-- NB: dLocal's zoid/post-robot SDK cannot mount directly to a Vue
         template ref element. We create a raw child div to mount into. -->
      <div ref="mountRef" class="w-full" />
    </Input>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import { uiTypeIs, and, optionIs, or } from "@jsonforms/core";

// --- components
import { FormField, Input } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { map } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

// --- state
const mountRef = ref<HTMLElement | null>(null);
const sdkErrors = ref<string[]>([]);
const isFocused = ref<true | undefined>(undefined);
const hasErrors = computed(() =>
  allErrors.value.length > 0 ? true : undefined
);

const allErrors = computed(() => [
  ...(formFieldProps.value.errors ?? []),
  ...sdkErrors.value
]);

// --- private

const fields = computed(() => {
  return control.value.uischema?.options?.fields;
});

function mountFields() {
  if (!fields.value || !mountRef.value) return;

  map(fields.value, (field: any, key: string) => {
    // NB: dLocal's zoid/post-robot SDK cannot mount directly to a Vue
    //     template ref element — create a raw child div per field.
    const mountTarget = document.createElement("div");
    mountTarget.id = `dlocal-field-${key}`;
    mountRef.value!.appendChild(mountTarget);

    field.on("change", (event: any) => {
      sdkErrors.value = event?.error?.message ? [event.error.message] : [];
    });

    field.on("focus", () => {
      isFocused.value = true;
    });

    field.on("blur", () => {
      isFocused.value = undefined;
    });

    field.mount(mountTarget);
  });
}

function unmountFields() {
  if (!fields.value) return;
  map(fields.value, (field: any) => field.unmount());
}

// --- lifecycle
onMounted(mountFields);
onUnmounted(unmountFields);
</script>

<script lang="ts">
export const tester = {
  rank: 10,
  controlType: and(
    uiTypeIs("Gateway"),
    or(optionIs("provider", "DLocal"), optionIs("provider", "DLocal_Card"))
  )
};
</script>
