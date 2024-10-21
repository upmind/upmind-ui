<template>
  <FormField
    v-bind="delegatedProps"
    class="flex flex-row flex-nowrap items-center gap-x-3 space-y-0"
  >
    <template #field>
      <!-- input -->
      <FormControl
        :invalid="!!control.errors"
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
import { computed } from "vue";
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { get } from "lodash-es";

// -- components
import { Switch } from "../../../switch";
import FormField from "../../FormField.vue";
import FormLabel from "../../FormLabel.vue";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
import FormMessage from "../../FormMessage.vue";
import FormRequiredIndicator from "../../FormRequiredIndicator.vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props),
  v => !!v
);

const delegatedProps = computed(() => {
  const options = get(appliedOptions.value, "options", {});

  return {
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
  };
});
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isBooleanControl, optionIs("format", "switch")),
};
</script>
