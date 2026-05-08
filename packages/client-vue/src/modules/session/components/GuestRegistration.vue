<template>
  <Section
    v-if="sessionMeta.isGuestClient && !isComplete"
    id="guest-registration"
    :label="t('auth.guest_register_title')"
    icon="user-plus-01"
  >
    <Alert
      v-if="!showForm"
      :title="t('auth.guest_register_title')"
      :description="t('auth.guest_register_description')"
      icon="user-plus-01"
      color="primary"
      :action="{ label: t('action.register') }"
      @click="showForm = true"
    />

    <template v-else>
      <Form
        v-if="!sessionMeta.isLoading"
        :loading="sessionMeta.isLoading"
        :processing="sessionMeta.isCompletingRegistration"
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        :additional-errors="validationErrors"
        @update:model-value="setModel"
        @resolve="handleSubmit"
        :actions="formActions"
      />
    </template>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";
import { Alert } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    /**
     * When true, skip the intermediate "Register" prompt and show the form immediately.
     * Useful when consumed from a dedicated register page (the user has already opted in).
     */
    autoShow?: boolean;
  }>(),
  { autoShow: false }
);

const { t } = useI18n();

const {
  meta: sessionMeta,
  model,
  schema,
  uischema,
  validationErrors,
  setModel,
  completeRegistration,
  showRegister
} = useSession();

const showForm = ref(props.autoShow);
const isComplete = ref(false);

if (props.autoShow) showRegister();

const formActions = computed(() => ({
  submit: {
    type: "submit" as const,
    label: t("action.register"),
    block: true,
    needsValid: true,
    size: "lg" as const
  }
}));

async function handleSubmit() {
  const success = await completeRegistration(model.value);
  if (success) {
    isComplete.value = true;
  }
}

watch(showForm, async show => {
  if (show) {
    await showRegister();
  }
});
</script>
