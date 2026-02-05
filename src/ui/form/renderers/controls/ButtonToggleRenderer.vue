<template>
  <FormField
    v-bind="formFieldProps"
    class="flex flex-row items-start space-y-0 gap-x-3"
  >
    <template #field>
      <!-- input -->
      <FormControl
        :invalid="!!control?.errors"
        :disabled="!control?.enabled"
        :required="control?.required"
        :formItemId="control.id"
        :formDescriptionId="`form-item-description-${control.id}`"
        :formMessageId="`form-item-message-${control.id}`"
      >
        <!-- label -->
        <div
          class="flex w-full flex-row flex-nowrap items-center justify-between"
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

          <FormRequiredIndicator
            v-if="control.required"
            :formItemId="control.id"
          />
        </div>
      </FormControl>

      <div class="w-full space-y-1 leading-none">
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

<script lang="ts" setup>
// --- external
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
// -- components
import { Toggle } from "../../../toggle";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
import FormField from "../../FormField.vue";
import FormMessage from "../../FormMessage.vue";
import FormRequiredIndicator from "../../FormRequiredIndicator.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props),
  value => !!value // Ensure bool value is set to the opposite value rather than null
);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isBooleanControl, optionIs("format", "toggle"))
};
</script>
