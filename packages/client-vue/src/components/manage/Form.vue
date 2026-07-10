<template>
  <component
    v-if="modal || (!modal && open)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    no-footer
    :title="t('action.add_new_or_update', !props.modelValue ? 1 : 0)"
  >
    <Skeleton
      v-if="meta.isLoading"
      :modal="modal"
      v-bind="formLoadingTestAttrs"
    />

    <template v-else>
      <Alert
        v-if="meta.hasErrors"
        :description="errors"
        :message="errors"
        :title="t('error.adding_or_updating', !props.modelValue ? 1 : 0)"
        color="danger"
        icon="alert-triangle"
        class="mb-4"
      />

      <UpmForm
        :dataAttrs="{ 'data-test-key': 'form-manage' }"
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        color="primary"
        @update:modelValue="doInput"
        @resolve="doResolve"
        @reject="doReject"
        :additional-errors="validationErrors"
        :processing="meta.isProcessing"
        :no-actions="noActions"
        v-model:touched="touched"
      >
        <template v-if="$slots.additional" #additional>
          <slot name="additional" />
        </template>
        <template #actions="{ doReject, doResolve, meta: formMeta }">
          <Actions
            :disabled="meta.isProcessing"
            :processing="meta.isProcessing"
            :no-cancel="!modal"
            :modal="modal"
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
import { onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Alert, Dialog, useTestAttrs } from "@upmind-automation/upmind-ui";
import UpmForm from "../form/Form.vue";
import Actions from "./Actions.vue";
import Skeleton from "./Skeleton.vue";
import type { ManageRendererProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<{
  useMutate: ManageRendererProps["useMutate"]; // the mutation composable needed to create or update the model
  modelValue?: string;
  readonly?: boolean;
  open?: boolean;
  modal?: boolean;
  touched?: boolean;
  options?: Record<string, any>; // additional options for the mutation composable
  noActions?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "resolve", value: any): void; // return the full <T> of the Mutate composable
  (e: "reject"): void;
  (e: "processing", value: boolean): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const formLoadingTestAttrs = useTestAttrs({ key: "form-loading" });

// --- state
const open = defineModel<boolean>("open");
const touched = defineModel<boolean>("touched");

const {
  meta,
  model,
  update,
  input,
  schema,
  uischema,
  stop,
  errors,
  validationErrors
} = props.useMutate(props.modelValue, props.options);

const doResolve = async () => {
  emits("processing", true);

  update()
    .then(value => {
      emits("resolve", value);
      emits("processing", false);
      doClose();
    })
    .catch(_error => {
      emits("processing", false);
      //  do nothing, error is handled in the form
    });
};

const doInput = (value: any) => {
  input(value);
};

const doReject = () => {
  emits("processing", false);
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
