<template>
  <div v-if="meta.isVisible" :class="styles.list.root">
    <!-- label -->
    <upw-label
      :id="controlWrapper.id"
      :text="controlWrapper.label"
      :requiredText="controlWrapper.requiredText"
      :optionalText="controlWrapper.optionalText"
      :hideRequired="controlWrapper.hideRequired"
      :hideStatus="controlWrapper.hideStatus"
      :required="meta.isRequired"
      :dirty="meta.isDirty"
      :invalid="meta.isInvalid"
      :disabled="meta.isDisabled"
      :size="size"
      :upwindConfig="config.label"
    />

    <ul :id="control.id + '-input'" :class="styles.list.wrapper">
      <li
        v-for="(optionElement, optionIndex) in control.options"
        :key="optionElement.value"
        :class="styles.list.option"
      >
        <control-wrapper-inline
          :id="`${control.id}-option-${optionIndex}`"
          :dirty="controlWrapper.dirty"
          :disabled="controlWrapper.disabled"
          :errors="controlWrapper.errors"
          :focused="controlWrapper.focused"
          :size="size"
          :visible="controlWrapper.visible"
          :label="optionElement.label"
          :upwind-config="[config, upwindConfig]"
          hide-status
          hide-feedback
        >
          <upw-checkbox
            :name="control.path"
            :disabled="!control.enabled"
            :id="`${control.id}-option-${optionIndex}`"
            :invalid="!!control?.errors"
            :model-value="isSelected(optionElement.value)"
            :value="optionElement.value"
            @blur="isFocused = false"
            @change="onChange"
            @focus="isFocused = true"
            :upwind-config="[config, upwindConfig]"
          />
        </control-wrapper-inline>
      </li>
    </ul>

    <!-- feedback -->
    <div class="feedback" :class="styles.feedback.root">
      <upw-icon
        key="icon"
        :class="styles.feedback.icon"
        icon="information-circle"
      />
      <span key="details">{{ control.errors || control.description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent } from "vue";
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
} from "@jsonforms/core";
import { rendererProps, useJsonFormsMultiEnumControl } from "@jsonforms/vue";

// --- components
import ControlWrapperInline from "../controls/wrapper/RendererInline.vue";
import UpwCheckbox from "../../../checkbox/Checkbox.vue";
import UpwLabel from "../../../label/Label.vue";
import UpwIcon from "../../../icon/Icon.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindArrayRenderer } from "../utils";
import { useStyles } from "../../../../utils";
import { includes, isEmpty, isNil } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../controls/types";
// ----------------------------------------------

export default defineComponent({
  name: "ArrayStringRenderer",
  components: {
    ControlWrapperInline,
    UpwCheckbox,
    UpwLabel,
    UpwIcon,
  },
  props: {
    ...rendererProps<ControlElement>(),
    // ---  Additional Attributes
    size: {
      type: String as PropType<InputProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const meta = computed(() => ({
      isInvalid: !isEmpty(renderer.control.value.errors),
      isValid:
        isEmpty(renderer.control.value.errors) &&
        !isNil(renderer.control.value.data),
      isDirty: renderer.controlWrapper.value.dirty,
      isFocused: renderer.controlWrapper.value.focused,
      isRequired: renderer.controlWrapper.value.required,
      isVisible: renderer.controlWrapper.value.visible,
      isDisabled: renderer.controlWrapper.value.disabled,
      hasFeedback:
        (isEmpty(renderer.control.value.errors) &&
          !isNil(renderer.control.value.description) &&
          (renderer.controlWrapper.value.focused ||
            !renderer.controlWrapper.value.focusDescription)) ||
        !isEmpty(renderer.controlWrapper.value.errors),
    }));

    const styles = useStyles(
      ["list", "feedback"],
      meta,
      config,
      props.upwindConfig
    );
    const renderer = useUpwindArrayRenderer(
      useJsonFormsMultiEnumControl(props)
    );

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      meta,
      styles,
      config, // pass the config to the  component
    };
  },
  methods: {
    isSelected(value) {
      return includes(this.control.data, value);
    },
    onChange(event) {
      const checked = event.target.checked;
      const value = event.target.value;
      if (checked) {
        this.addItem(this.control.path, value);
      } else {
        this.removeItem?.(this.control.path, value);
      }
    },
  },
});

const hasOneOfItems = (schema: JsonSchema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema) =>
  schema.type === "string" && schema.enum !== undefined;

export const tester = {
  rank: 5,
  controlType: and(
    uiTypeIs("Control"),
    and(
      schemaMatches(
        schema =>
          hasType(schema, "array") &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches("items", schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  ),
};
</script>
