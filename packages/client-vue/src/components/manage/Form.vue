<template>
  <component
    v-if="modal || (!modal && open)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    :title="t(`${i18nKey ?? 'manage'}.title`, { isNew: !props.modelValue })"
  >
    <Skeleton v-if="meta.isLoading" :i18nKey="i18nKey" />

    <template v-else>
      <Alert
        v-if="meta.hasErrors"
        :description="errors"
        :message="errors"
        :title="t(`${i18nKey ?? 'manage'}.error`, { isNew: !props.modelValue })"
        color="error"
        icon="alert-triangle"
      />

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        color="secondary"
        @update:modelValue="doInput"
        @resolve="doResolve"
        @reject="doReject"
        :additional-errors="validationErrors"
        :processing="meta.isProcessing"
      >
        <template #actions="{ doReject, doResolve }">
          <Actions
            :i18nKey="i18nKey"
            :disabled="meta.isProcessing || !meta.isValid"
            :processing="meta.isProcessing"
            :loading="meta.isLoading"
            @save="doResolve"
            @cancel="doReject"
          />
        </template>
      </UpmForm>
    </template>
  </component>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal

// --- components
import { UpmForm } from "../form";
import { Dialog, Alert } from "@upmind-automation/upmind-ui";
import Skeleton from "./Skeleton.vue";
import Actions from "./Actions.vue";

// --- utils

// --- types
import type { ManageRendererProps } from "./types";
import { onUnmounted } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  useMutate: ManageRendererProps["useMutate"]; // the mutation composable needed to create or update the model
  i18nKey?: string; // the i18n key to use for translations
  modelValue?: string;
  readonly?: boolean;
  open?: boolean;
  modal?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "resolve", value: string): void;
  (e: "reject"): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

// --- state
const open = useVModel(props, "open", emits);

const {
  meta,
  model,
  update,
  input,
  schema,
  uischema,
  stop,
  errors,
  validationErrors,
} = props.useMutate(props.modelValue);

const doResolve = async () => {
  update()
    .then(value => {
      emits("resolve", value.id);
      doClose();
    })
    .catch(error => {
      //  do nothing, error is handled in the form
    });
};

const doInput = (value: any) => {
  input(value);
};

const doReject = () => {
  emits("reject");
  doClose();
};

const doClose = () => {
  stop();
  open.value = false;
};

onUnmounted(() => {
  stop();
});
</script>
