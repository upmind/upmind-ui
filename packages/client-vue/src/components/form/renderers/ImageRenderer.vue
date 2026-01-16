<template>
  <FormField v-bind="formFieldProps">
    <Loading :active="meta.isLoading">
      <pre>{{ { src, files } }}</pre>
      <FilePond
        :files="files"
        v-bind="appliedOptions"
        :allow-multiple="false"
        :accepted-file-types="fileTypes"
        :max-files="1"
        :label-idle="labelText"
        :class="styles.form.image"
        max-file-size="5MB"
        stylePanelAspectRatio="0.2"
        stylePanelLayout="integrated"
        @addfile="onAddFile"
        @removefile="onRemoveFile"
      />
    </Loading>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { onBeforeUnmount, computed, ref } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import { useUpload } from "@upmind-automation/headless";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";

// --- internal
import config from "../form.config";

// --- components
import { FormField, Loading } from "@upmind-automation/upmind-ui";
import vueFilePond from "vue-filepond";

// types

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

const props = defineProps<RendererProps<ControlElement>>();
const fileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const modelValue = ref(<File | null>null);

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const { add, remove, stop, meta, getImageByHash, src } = useUpload(
  appliedOptions.value.field
);

const styles = useStyles(["form.image"], {}, config);

// --- side effects

// check if the control has a file and if it does, we need to get the file from the server
if (control.value?.data) {
  getImageByHash(control.value?.data);
}

onBeforeUnmount(() => stop());

async function onAddFile(error: any, filepond: any) {
  // bail out if the file is the same as the current one
  if (filepond.source == src.value) {
    return;
  }

  if (
    isEmpty(filepond.source) ||
    modelValue.value?.name == filepond.file?.name
  ) {
    return;
  }

  modelValue.value = filepond.file;
  const data = await add(filepond.file);
  onInput(data, false);
}

async function onRemoveFile() {
  onInput(null, false);
  remove();
}

const labelText = computed(() => {
  return `Drag & Drop your image or <span class="filepond--label-action">Browse</span>`;
});

const files = computed(() => {
  if (src.value) return [src.value];
  if (modelValue.value) return [modelValue.value];
  return [];
});
</script>

<script lang="ts">
import { and, or, uiTypeIs, optionIs, formatIs } from "@jsonforms/core";
import { isEmpty, startsWith } from "lodash-es";

export const tester = {
  rank: 2,
  controlType: and(
    uiTypeIs("Control"),
    or(formatIs("file"), optionIs("type", "image"))
  )
};
</script>

<style>
.filepond--image-preview-wrapper {
  border-radius: var(--control-radius) !important;
  border: 0;
}

.filepond--root {
  background-color: var(--color-control-surface) !important;
  border-radius: var(--control-radius) !important;
}

.filepond--image-preview {
  background-color: transparent;
}

.filepond--panel-root {
  background-color: transparent;
}

.filepond--drop-label {
  color: var(--color-text-muted);
}

.filepond--label-action {
  color: var(--color-text-button-link);
}
</style>
