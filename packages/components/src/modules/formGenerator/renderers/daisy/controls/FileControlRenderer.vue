<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      v-if="!meta.hasFile"
      :id="control.id + '-input'"
      :class="[
        styles.control.file,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      type="file"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <aside
      class="relative mt-2 max-w-xs max-h-xs bg-neutral text-neutral-content"
    >
      <div class="absolute top-0 left-0 right-0 inline-flex p-2 justify-end">
        <span v-if="meta.isProcessing" class="loading loading-dots"></span>

        <!-- <check-circle-icon v-if="meta.isComplete" class="h-8 w-8" /> -->

        <button
          class="btn btn-circle btn-ghost btn-sm hover:bg-neutral-focus"
          @click="remove"
          v-if="meta.isComplete"
        >
          <x-mark-icon class="w-fit h-fit" />
          <span class="sr-only">Remove image</span>
        </button>
      </div>

      <img
        v-if="src"
        :src="src"
        alt="uploaded image thumbnail"
        class="w-fit h-fit m-0"
      />
    </aside>
  </control-wrapper>
</template>

<script lang="ts">
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry
} from "@jsonforms/core";

import {
  rankWith,
  isStringControl,
  uiTypeIs,
  formatIs,
  optionIs,
  // scopeEndsWith,
  and,
  or
} from "@jsonforms/core";
import { defineComponent, onBeforeUnmount } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { useUpload } from "../../../composables";

const controlRenderer = defineComponent({
  name: "StringControlRenderer",
  components: {
    ControlWrapper,
    CheckCircleIcon,
    XMarkIcon
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  data() {
    return {};
  },
  setup(props: RendererProps<ControlElement>) {
    const {
      file,
      fileTypes,
      src,
      errors,
      meta,
      add,
      remove,
      getImage,
      destroy
    } = useUpload();

    if (props.data && !meta.hasFile) {
      getImage(props.data);
    }

    onBeforeUnmount(() => {
      destroy();
    });

    const inputControl = useDaisyControl(useJsonFormsControl(props), onChange);

    function onChange(target: Event) {
      add(target.files[0]);
      return target.value || undefined;
    }

    return {
      meta,
      file,
      errors,
      src,
      ...inputControl
    };
  }
});

export default controlRenderer;

export const isFileControl = and(
  uiTypeIs("Control"),
  or(optionIs("type", "file"), formatIs("file"))
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isFileControl))
};
</script>
