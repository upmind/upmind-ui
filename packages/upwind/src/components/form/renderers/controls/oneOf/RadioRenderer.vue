<template>
  <div v-if="meta.isVisible" :class="styles.radiolist.root">
    <!-- label -->
    <upw-label
      :id="controlWrapper.id"
      :label="controlWrapper.label"
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

    <ul :id="control.id + '-radio'" :class="styles.radiolist.list">
      <template :class="styles.radiolist.title" v-if="appliedOptions?.title">
        {{ appliedOptions.title }}
      </template>

      <li class="sr-only" :class="styles.radiolist.option">
        <control-wrapper-inline
          :id="`${control.id}-option-empty`"
          :dirty="controlWrapper.dirty"
          :disabled="controlWrapper.disabled"
          :errors="controlWrapper.errors"
          :focused="controlWrapper.focused"
          :is-focused="isFocused"
          :size="size"
          :visible="controlWrapper.visible"
          label=""
          :upwind-config="[config, upwindConfig]"
          hide-status
        >
          <upw-radio
            key="empty"
            :name="control.path"
            :disabled="!control.enabled"
            :id="`${control.id}-option-empty`"
            :placeholder="appliedOptions.placeholder"
            :invalid="!!control?.errors"
            :model-value="!control?.data"
            value=""
            @blur="isFocused = false"
            @change="onChange"
            @focus="isFocused = true"
            :upwind-config="[config, upwindConfig]"
          />
        </control-wrapper-inline>
      </li>

      <li
        v-for="(optionElement, optionIndex) in control.options"
        :key="optionElement.value"
        :class="styles.radiolist.option"
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
        >
          <upw-radio
            :name="control.path"
            :disabled="!control.enabled"
            :id="`${control.id}-option-${optionIndex}`"
            :invalid="!!control?.errors"
            :model-value="control?.data == optionElement.value"
            :value="optionElement.value"
            @blur="isFocused = false"
            @change="onChange"
            @focus="isFocused = true"
            :upwind-config="[config, upwindConfig]"
          />
        </control-wrapper-inline>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent, computed } from "vue";
import { isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import ControlWrapperInline from "../wrapper/RendererInline.vue";
import UpwRadio from "../../../../radio/Radio.vue";
import UpwLabel from "../../../../label/Label.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";
import { isEmpty, isNil } from "lodash-es";

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
    const styles = useStyles(["radiolist"], props, config, props.upwindConfig);
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target => (target.selectedIndex === 0 ? undefined : target.value)
    );

    const meta = computed(() => ({
      isInvalid: !isEmpty(renderer.controlWrapper.value.errors),
      isValid:
        isEmpty(renderer.controlWrapper.value.errors) &&
        !isNil(renderer.controlWrapper.value.data),
      isDirty: renderer.controlWrapper.value.dirty,
      isFocused: renderer.controlWrapper.value.focused,
      isRequired: renderer.controlWrapper.value.required,
      isVisible: renderer.controlWrapper.value.visible,
      isDisabled: renderer.controlWrapper.value.disabled,
      hasFeedback:
        (isEmpty(renderer.controlWrapper.value.errors) &&
          !isNil(renderer.controlWrapper.value.description) &&
          (renderer.controlWrapper.value.focused ||
            renderer.controlWrapper.value.persistDescription)) ||
        !isEmpty(renderer.controlWrapper.value.errors),

      showAsRequired:
        renderer.controlWrapper.value.required &&
        !renderer.controlWrapper.value.hideRequired,
      showAsOptional:
        !renderer.controlWrapper.value.required &&
        !renderer.controlWrapper.value.hideRequired &&
        !isEmpty(renderer.controlWrapper.value.optionalText),
    }));

    return {
      ...renderer,
      meta,
      styles,
      config, // pass the radio config to the radio component
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
