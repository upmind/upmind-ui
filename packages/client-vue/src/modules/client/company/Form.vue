<template>
  <pre>{{ { modelValue, model } }}</pre>
  <component
    v-if="modal || (!modal && open)"
    :is="modal ? Dialog : 'section'"
    v-model:open="open"
    size="3xl"
    :title="t('client.company.form.title', { isNew: !props.modelValue })"
  >
    <Skeleton v-if="meta.isLoading" />

    <UpmForm
      v-else
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      color="secondary"
      @update:modelValue="doInput"
      @resolve="doResolve"
      @reject="doReject"
      :processing="meta.isProcessing"
    >
      <template #actions="{ doReject, doResolve }">
        <Actions
          :disabled="meta.isProcessing || !meta.isValid"
          :processing="meta.isProcessing"
          :loading="meta.isLoading"
          @save="doResolve"
          @cancel="doReject"
        />
      </template>
    </UpmForm>
  </component>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  useClientCompany,
  type CompanyModel,
} from "@upmind-automation/headless";

// --- components
import { UpmForm } from "../../../components/form";
import { Dialog } from "@upmind-automation/upmind-ui";
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
  (e: "resolve", value: CompanyModel["id"]): void;
  (e: "reject"): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

// --- state
const open = useVModel(props, "open", emits);

const { meta, model, update, clear, input, schema, uischema, stop } =
  useClientCompany(props.clientId, props.modelValue);

const doResolve = async () => {
  update().then(value => {
    emits("resolve", value.id);
    doClose();
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
