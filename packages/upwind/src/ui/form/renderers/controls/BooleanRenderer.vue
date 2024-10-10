<template>
  <FormItem
    :formItemId="control.id"
    class="flex flex-row items-start gap-x-3 space-y-0"
  >
    <!-- input -->
    <FormControl
      :invalid="!!control.errors"
      :formItemId="control.id"
      :formDescriptionId="`form-item-description-${control.id}`"
      :formMessageId="`form-item-message-${control.id}`"
    >
      <Checkbox
        :id="control.id"
        :disabled="!control.enabled"
        :checked="control.data"
        @update:checked="onInput"
      />
    </FormControl>

    <div class="space-y-1 leading-none" v-auto-animate>
      <!-- label -->
      <FormLabel :formItemId="control.id" :invalid="!!control.errors">
        {{ control.label }}
      </FormLabel>

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
  </FormItem>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isBooleanControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Checkbox } from "../../../checkbox";
import FormItem from "../../FormItem.vue";
import FormLabel from "../../FormLabel.vue";
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
  name: "BooleanRenderer",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    Checkbox,
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

export const tester = { rank: 2, controlType: isBooleanControl };
</script>
