<template>
  <FormField v-bind="controlWrapper">
    <input
      ref="input"
      :id="control.id + '-input'"
      :class="[
        styles.control.file,
        controlWrapper.errors ? styles.control.error.input : null,
        { hidden: meta.hasFile || meta.isProcessing },
      ]"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      type="file"
      accept="image/*"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <aside
      class="card sm:card-side rounded-btn bg-base-100 border"
      v-if="meta.hasFile || meta.isProcessing"
    >
      <figure
        class="relative m-0 aspect-square bg-neutral-100 sm:w-1/2 md:w-36"
      >
        <img
          v-if="src"
          :src="src"
          alt="uploaded image thumbnail"
          class="aspect-square h-full w-full rounded-l-lg object-cover"
        />
        <span
          v-if="meta.isProcessing"
          class="loading loading-dots absolute"
        ></span>
      </figure>
      <div class="card-body p-4">
        <h4 class="card-title m-0 text-base" v-if="name">{{ name }}</h4>
        <span v-if="meta.isProcessing">Uploading image...</span>
        <use-time-ago v-else-if="created" v-slot="{ timeAgo }" :time="created">
          Uploaded {{ timeAgo }}
        </use-time-ago>
        <span v-else-if="!meta.isProcessing">Image uploaded</span>
        <div class="card-actions mt-auto justify-end">
          <button class="btn btn-ghost btn-sm" @click.prevent="onOpen">
            Change Image
          </button>
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click.prevent="onRemove"
            v-if="meta.isComplete"
          >
            <Icon icon="bin" class="h-6 w-6" />
            <span class="sr-only">Remove image</span>
          </button>
        </div>
      </div>
    </aside>
  </FormField>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from "vue";
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { FormField, Icon } from "@upmind-automation/upmind-ui";
import { useDaisyControl } from "../util";
import { useUpload } from "@upmind-automation/headless-vue";
import { UseTimeAgo } from "@vueuse/components";

const props = defineProps<RendererProps<ControlElement>>();
const input = ref<HTMLInputElement>();

const inputControl = useDaisyControl(
  useJsonFormsControl(props),
  (target: any) => file.value || target?.value || undefined
);

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
  stop,
} = useUpload(inputControl.appliedOptions.value.field);

onBeforeUnmount(() => stop());

if (inputControl.control.value?.data) {
  getImageByHash(inputControl.control.value.data);
}

async function onChange(event: Event) {
  const target = event.currentTarget as HTMLInputElement;
  if (target?.files?.[0]) {
    try {
      await add(target.files[0] as any);
    } catch (error) {}
  }
  inputControl.onChange(event);
}

function onRemove(event: Event) {
  remove();
  if (input.value) {
    input.value.value = "";
  }
  inputControl.onChange(event);
}

function onOpen() {
  input.value?.click();
}

const controlWrapper = computed(() => ({
  ...inputControl.controlWrapper.value,
  name: inputControl.control.value.path,
}));

const { control, handleChange, appliedOptions, isFocused, styles } =
  inputControl;
</script>

<script lang="ts">
import { and, or, uiTypeIs, optionIs, formatIs } from "@jsonforms/core";

export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    or(optionIs("type", "file"), formatIs("file"), optionIs("type", "image"))
  ),
};
</script>
