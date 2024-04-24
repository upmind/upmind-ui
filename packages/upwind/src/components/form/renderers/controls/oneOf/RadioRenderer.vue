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

    <ul :id="control.id + '-radio'" :class="styles.list.wrapper">
      <template :class="styles.list.title" v-if="appliedOptions?.title">
        {{ appliedOptions.title }}
      </template>

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
          <upw-radio
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
import { defineComponent, computed } from "vue";
import { isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import ControlWrapperInline from "../wrapper/RendererInline.vue";
import UpwRadio from "../../../../radio/Radio.vue";
import UpwLabel from "../../../../label/Label.vue";
import UpwIcon from "../../../../icon/Icon.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";
import { isEmpty, isNil, find } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "RadioRenderer",
  components: {
    ControlWrapperInline,
    UpwRadio,
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
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target =>
        find(
          renderer.control.value.options,
          ({ value }) => value == target.value
        )?.value

      // target => (target.selectedIndex === 0 ? undefined : target.value)
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
    isSelected(value: string): boolean {
      return this.control.data === value;
    },
  },
});

export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
