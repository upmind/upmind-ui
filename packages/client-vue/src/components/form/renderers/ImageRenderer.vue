<template>
  <FormField v-bind="formFieldProps">
    <FilePond
      v-bind="appliedOptions"
      :allow-multiple="false"
      :accepted-file-types="fileTypes"
      :max-files="1"
      :max-file-size="'5MB'"
      :label-idle="labelText"
      :credits="false"
      stylePanelLayout="integrated"
      :class="styles.form.file"
      @addfile="onAddFile"
      @removefile="remove"
      @change="remove"
    />
  </FormField>
</template>

<script setup lang="ts">
import { onBeforeUnmount, computed } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import { FormField } from "@upmind-automation/upmind-ui";
import { useUpload } from "@upmind-automation/headless-vue";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";

import vueFilePond from "vue-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";

import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";

import config from "../form.config";
import type { ComputedRef } from "vue";

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

const props = defineProps<RendererProps<ControlElement>>();
const fileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const { formFieldProps, appliedOptions } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const { add, remove, stop } = useUpload(appliedOptions.value.field);

const styles = useStyles(["form.file"], {}, config) as ComputedRef<{
  form: {
    file: string;
  };
}>;

onBeforeUnmount(() => stop());

async function onAddFile(error: any, file: any) {
  await add(file.file);
}

const labelText = computed(() => {
  return `Drag & Drop your image or <span class="filepond--label-action">Browse</span`;
});
</script>

<script lang="ts">
import { and, or, uiTypeIs, optionIs, formatIs } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(
    uiTypeIs("Control"),
    or(formatIs("file"), optionIs("type", "image"))
  ),
};
</script>

<style>
.filepond--image-preview-wrapper {
  @apply rounded-lg !important;
  border: 0 !important;
}

.filepond--image-preview {
  background-color: transparent !important;
}
</style>
