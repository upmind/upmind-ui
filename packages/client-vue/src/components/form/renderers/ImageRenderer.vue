<template>
  <FormField v-bind="formFieldProps">
    <Loading :label="t('text.loading')" :active="meta.isLoading">
      <FilePond
        v-bind="appliedOptions"
        :allow-multiple="false"
        :accepted-file-types="fileTypes"
        :max-files="1"
        :label-idle="labelText"
        class="text-muted rounded-field mb-4 border border-(--border-control) transition-all duration-300"
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
import { and, or, uiTypeIs, optionIs, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import { onBeforeUnmount, computed } from "vue";
import vueFilePond from "vue-filepond";
import { useI18n } from "vue-i18n";
import { useUpload } from "@upmind-automation/headless";
import { Loading } from "@upmind/ui";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";

const { t } = useI18n();
const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

const props = defineProps<RendererProps<ControlElement>>();
const fileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const {
  control: _control,
  formFieldProps,
  appliedOptions,
  onInput
} = useUpmindUIRenderer(useJsonFormsControl(props));

const { add, remove, stop, meta } = useUpload(appliedOptions.value.field);

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
  border-radius: var(--radius-slot-control) !important;
  border: 0;
}

.filepond--root {
  background-color: var(--color-control-surface) !important;
  border-radius: var(--radius-slot-control) !important;
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
