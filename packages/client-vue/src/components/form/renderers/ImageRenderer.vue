<template>
  <FormField v-bind="formFieldProps">
    <Loading :active="meta.isLoading">
      <FilePond
        v-bind="appliedOptions"
        :allow-multiple="false"
        :accepted-file-types="fileTypes"
        :max-files="1"
        :label-idle="labelText"
        :credits="false"
        :class="styles.form.file"
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
import { onBeforeUnmount, computed } from "vue";
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
import type { ComputedRef } from "vue";

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

const props = defineProps<RendererProps<ControlElement>>();
const fileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const { add, remove, stop, meta } = useUpload(appliedOptions.value.field);

const styles = useStyles(["form.file"], {}, config) as ComputedRef<{
  form: {
    file: string;
  };
}>;

onBeforeUnmount(() => stop());

async function onAddFile(error: any, file: any) {
  const data = await add(file.file);
  onInput(data, false);
}

async function onRemoveFile() {
  onInput(null, false);
  remove();
}

const labelText = computed(() => {
  return `Drag & Drop your image or <span class="filepond--label-action">Browse</span>`;
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
  border: 0;
}

.filepond--image-preview {
  background-color: transparent;
}

.filepond--panel-root {
  background-color: transparent;
}
</style>
