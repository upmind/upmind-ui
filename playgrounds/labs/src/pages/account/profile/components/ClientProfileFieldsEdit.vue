<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <pre>{{ meta }}</pre>

    <Alert v-if="meta.hasErrors" type="error" class="mb-4">
      <pre>{{ errors }}</pre>
    </Alert>

    <UpmForm
      v-if="!meta.isLoading"
      :additional-errors="errors?.data"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :touched="meta.showErrors"
      :processing="meta.isProcessing"
      :loading="meta.isLoading"
      :actions="actions"
      @reject="reject"
      @resolve="resolve"
      @update:modelValue="input"
    />
    <pre>{{ model }}</pre>
  </UpmSection>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { UpmSection, UpmForm } from "@upmind-automation/client-vue";
import { usePersonalDetailsManager } from "@upmind-automation/headless";
import { Alert } from "@upmind-automation/upmind-ui";
import type { FormActionProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    fields: string[];
    profileRoute?: string;
  }>(),
  {
    profileRoute: "account.profile"
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

const {
  errors,
  meta,
  model,
  schema,
  uischema,
  update,
  input,
  clear: _clear,
  isReady,
  stop
} = usePersonalDetailsManager({
  filterFields: props.fields
});

const actions = computed((): Record<string, FormActionProps> => {
  return {
    submit: {
      type: "submit",
      label: t("action.apply"),
      size: "lg",
      color: "primary",
      needsValid: true
    },
    cancel: {
      type: "reset",
      label: t("action.cancel"),
      size: "lg",
      variant: "subtle"
    }
  };
});

await isReady();

function resolve() {
  update()
    .then(reject)
    .catch(() => {
      // show error?
    });
}

function reject() {
  router.push({ name: props.profileRoute });
}

onBeforeUnmount(() => {
  stop();
});
</script>
