<template>
  <FormField
    v-bind="{ ...delegatedProps, ...appliedOptions }"
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
        <FormBooleanLabelGroup>
          <!-- label -->
          <template #labelGroup>
            <FormLabel :formItemId="control.id" :invalid="!!control.errors">
              {{ control.label }}
            </FormLabel>
          </template>

          <!-- description -->
          <template #descriptionGroup>
            <FormDescription
              v-if="control?.description"
              :formDescriptionId="`form-item-description-${control.id}`"
              class="!my-0"
            >
              {{ control.description }}
            </FormDescription>
          </template>

          <!-- required -->
          <template #requiredLabelGroup>
            <FormRequiredLabel
              :required="control.required"
              :formItemId="control.id"
            />
          </template>
        </FormBooleanLabelGroup>

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

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Switch } from "../../../switch";
import FormField from "../../FormField.vue";
import FormLabel from "../../FormLabel.vue";
import FormControl from "../../FormControl.vue";
import FormDescription from "../../FormDescription.vue";
import FormMessage from "../../FormMessage.vue";
import FormRequiredLabel from "../../FormRequiredLabel.vue";
import FormBooleanLabelGroup from "../../FormBooleanLabelGroup.vue";
// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "BooleanSwitchRenderer",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    FormField,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    Switch,
    FormBooleanLabelGroup,
    FormRequiredLabel,
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
  controlType: and(isBooleanControl, optionIs("format", "switch")),
};
</script>
