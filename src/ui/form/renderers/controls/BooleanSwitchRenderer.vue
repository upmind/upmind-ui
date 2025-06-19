<template>
  <FormField
    v-bind="formFieldProps"
    class="flex flex-row flex-nowrap items-center gap-x-3 space-y-0"
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
        <Switch
          :id="control.id"
          :disabled="!control.enabled"
          :checked="control.data"
          @update:checked="onInput"
        />
      </FormControl>

      <div class="w-full space-y-1 leading-none" v-auto-animate>
        <div
          class="flex w-full flex-row flex-nowrap items-center justify-between"
        >
          <!-- label -->
          <FormLabel :formItemId="control.id" :invalid="!!control.errors">
            {{ control.label }}
          </FormLabel>

          <!-- description -->
          <FormDescription
            v-if="control?.description"
            :formDescriptionId="`form-item-description-${control.id}`"
            class="!my-0"
          >
            {{ control.description }}
          </FormDescription>

          <!-- required -->
          <FormRequiredIndicator
            v-if="control.required"
            :formItemId="control.id"
          />
        </div>

        <!-- validation messages -->
        <FormMessage
          v-if="!!control.errors"
          :formMessageId="`form-item-message-${control.id}`"
          :name="control.path"
          :errors="control.errors"
        />
      </div>
    </template>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// -- components
import { Switch } from "../../../switch";
import FormField from "../../FormField.vue";
import FormLabel from "../../FormLabel.vue";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
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
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isBooleanControl, optionIs("format", "switch")),
};
</script>
