<template>
  <FormField
    v-bind="{ ...delegatedProps, ...appliedOptions }"
    class="flex flex-row items-start gap-x-3 space-y-0"
  >
    <template #field>
      <!-- input -->
      <FormControl
        :invalid="!!control.errors"
        :formItemId="control.id"
        :formDescriptionId="`form-item-description-${control.id}`"
        :formMessageId="`form-item-message-${control.id}`"
      >
        <Toggle
          :id="control.id"
          :disabled="!control.enabled"
          :checked="control.data"
          :aria-label="control.label"
          @update:checked="onInput"
        >
          <!-- label -->
          {{ control.label }}
        </Toggle>
      </FormControl>

      <div class="w-full space-y-1 leading-none" v-auto-animate>
        <!-- validation messages -->
        <FormMessage
          v-if="!!control.errors"
          :formMessageId="`form-item-message-${control.id}`"
          :name="control.path"
          :errors="control.errors"
        />

        <!-- description -->
        <FormDescription
          v-if="control?.description"
          :formDescriptionId="`form-item-description-${control.id}`"
        >
          {{ control.description }}
        </FormDescription>
      </div>
    </template>
  </FormField>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { isBooleanControl, and, formatIs } from "@jsonforms/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Toggle } from "../../../toggle";
import FormField from "../../FormField.vue";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
import FormMessage from "../../FormMessage.vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "ButtonToggleRenderer",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    FormField,
    FormControl,
    FormDescription,
    FormMessage,
    Toggle,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(useJsonFormsControl(props), v => !!v);

    return {
      ...renderer,
    };
  },
  computed: {
    delegatedProps() {
      return {
        id: this.control.id,
        name: this.control.path,
        errors: this.control.errors,
        // ---
        label: this.control.label,
        description: this.control.description,
        // ---
        required: this.control.required,
        disabled: !this.control.enabled,
        visible: this.control.visible,
      };
    },
  },
});

export const tester = {
  rank: 2,
  controlType: and(isBooleanControl, formatIs("toggle")),
};
</script>
