<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      ref="input"
      :id="control.id + '-input'"
      :class="[
        styles.control.file,
        controlWrapper.errors ? styles.control.error.input : null,
        { hidden: meta.hasFile || meta.isProcessing }
      ]"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      type="file"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <aside
      class="card sm:card-side bg-base-100 border rounded-btn"
      v-if="meta.hasFile || meta.isProcessing"
    >
      <figure
        class="relative m-0 sm:w-1/2 md:w-36 aspect-square bg-neutral-100"
      >
        <img
          v-if="src"
          :src="src"
          alt="uploaded image thumbnail "
          class="aspect-square w-full h-full"
        />
        <span
          v-if="meta.isProcessing"
          class="loading loading-dots absolute"
        ></span>
      </figure>
      <div class="card-body p-4">
        <h4 class="card-title m-0 text-base" v-if="name">{{ name }}</h4>

        <span v-if="meta.isProcessing">Uploading...</span>

        <use-time-ago v-else-if="created" v-slot="{ timeAgo }" :time="created">
          Uploaded {{ timeAgo }}
        </use-time-ago>
        <span v-else-if="!meta.isProcessing">Uploaded</span>

        <div class="card-actions justify-end mt-auto">
          <button class="btn btn-ghost btn-sm" @click.prevent="onOpen">
            Change
          </button>
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click.prevent="onRemove"
            v-if="meta.isComplete"
          >
            <trash-icon class="w-6 h-6" />
            <span class="sr-only">Remove image</span>
          </button>
        </div>
      </div>
    </aside>
  </control-wrapper>
</template>

<script lang="ts">
import { ref } from "vue";
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
import { TrashIcon } from "@heroicons/vue/24/outline";
import { useUpload } from "@upmind/vue";
import { UseTimeAgo } from "@vueuse/components";
const controlRenderer = defineComponent({
  name: "StringControlRenderer",
  components: {
    UseTimeAgo,
    ControlWrapper,
    TrashIcon
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  data() {
    return {};
  },
  setup(props: RendererProps<ControlElement>) {
    const input = ref();
    // create an instance of the input control
    const inputControl = useDaisyControl(useJsonFormsControl(props), target => {
      return file.value || target?.value || undefined;
    });

    const {
      created,
      file,
      name,
      src,
      errors,
      meta,
      add,
      remove,
      getImageByHash,
      destroy
    } = useUpload(inputControl.appliedOptions.value?.field);

    onBeforeUnmount(() => {
      destroy();
    });

    // check if the control has a file and if it does, we need to get the file from the server
    if (inputControl.control.value?.data)
      getImageByHash(inputControl.control.value?.data);

    async function onChange(target: Event) {
      // uplod the file to the server
      const file = target.currentTarget.files[0];
      await add(file);
      // forward the event to the input control that will trigger the update
      inputControl.onChange(target);
    }

    function onRemove(target: Event) {
      remove();
      input.value.value = "";
      inputControl.onChange(target);
    }

    function onOpen() {
      input.value.click();
    }

    return {
      input,
      meta,
      file,
      name,
      created,
      errors,
      src,
      ...inputControl,
      onChange,
      onRemove,
      onOpen
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
