<template>
  <Section
    v-if="meta.isGuestClient"
    id="guest-email"
    :label="t('form.guest_email.label')"
    icon="mail-01"
  >
    <Form
      :disabled="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="validationErrors"
      @update:modelValue="handleUpdate"
      no-actions
      @focusout="handleBlur"
    />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useGuestEmail } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const {
  meta,
  model,
  schema,
  uischema,
  validationErrors,
  setModel,
  showGuestEmail,
  updateGuestEmail
} = useGuestEmail();

onMounted(() => {
  if (meta.value.isGuestClient) showGuestEmail();
});

let latestEmail: string | undefined;

function handleUpdate(value: { email?: string }) {
  latestEmail = value?.email;
  setModel(value);
}

function handleBlur() {
  if (latestEmail) updateGuestEmail(latestEmail);
}
</script>
