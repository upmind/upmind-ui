<template>
  <FormField
    v-bind="formFieldProps"
    class="flex flex-row flex-nowrap items-start space-y-0 gap-x-3"
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
        <Checkbox
          :id="control.id"
          :checked="control.data"
          @update:checked="onInput"
        />
      </FormControl>

      <div class="w-full space-y-1 leading-none">
        <div
          class="flex w-full flex-col flex-nowrap items-center justify-between"
        >
          <!-- label -->
          <FormLabel
            :formItemId="control.id"
            :invalid="!!control.errors"
            class="text-sm"
          >
            {{ control.label }}

            <FormRequiredIndicator
              v-if="control.required"
              :formItemId="control.id"
            />
          </FormLabel>

          <!-- description -->
          <FormDescription
            v-if="control?.description"
            :formDescriptionId="`form-item-description-${control.id}`"
            class="text-muted mt-1 mb-0 leading-tight"
          >
            {{ control.description }}
          </FormDescription>
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
import { isBooleanControl } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Checkbox } from "../../../checkbox";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
import FormField from "../../FormField.vue";
import FormLabel from "../../FormLabel.vue";
import FormMessage from "../../FormMessage.vue";
import FormRequiredIndicator from "../../FormRequiredIndicator.vue";
import { useUpmindUIRenderer } from "../utils";
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
export const tester = { rank: 1, controlType: isBooleanControl };
</script>
