<template>
  <component
    v-if="modal || (!modal && open)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    :title="t('client.phone.form.title', { isNew: !props.modelValue })"
  >
    <Skeleton v-if="meta.isLoading" />

    <template v-else>
      <Alert
        v-if="meta.hasErrors"
        :description="errors"
        :message="errors"
        :title="t('client.phone.form.error', { isNew: !props.modelValue })"
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
            type="phone"
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
import { useClientPhone, type PhoneModel } from "@upmind-automation/headless";

// --- components
import { UpmForm } from "../../../components/form";
import { Dialog, Alert } from "@upmind-automation/upmind-ui";
import Skeleton from "../components/Skeleton.vue";
import Actions from "../components/Actions.vue";

// --- utils

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  modelValue?: string;
  readonly?: boolean;
  open?: boolean;
  modal?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "resolve", value: PhoneModel["id"]): void;
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
  clear,
  input,
  schema,
  uischema,
  stop,
  errors,
  validationErrors,
} = useClientPhone(props.modelValue, {
  clientId: props.clientId,
});

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
  clear();
  emits("reject");
  doClose();
};

const doClose = () => {
  stop();
  open.value = false;
};
</script>
