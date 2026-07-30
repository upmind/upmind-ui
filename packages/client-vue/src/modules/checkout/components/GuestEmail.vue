<template>
  <Section
    v-if="account.isGuest.value"
    id="guest-email"
    :label="t('form.guest_email.label')"
    icon="mail-01"
    :disabled="props.disabled"
  >
    <Form
      :disabled="account.isProcessing.value"
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
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ScopeActorTypes, useAccount } from "@upmind-automation/headless";
import Form from "../../../components/form/Form.vue";
import Section from "../../../components/section/Section.vue";

// --- types
import type { GuestEmailProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<GuestEmailProps>();

const { t } = useI18n();
const accountScope = useAccount().as(ScopeActorTypes.CLIENT);
const account = accountScope.useMeta();
const { model, schema, uischema, validationErrors } = accountScope.useContext();
const { set, showGuestEmail, updateGuestEmail } = accountScope.useActions();

onMounted(() => {
  if (account.isGuest.value) showGuestEmail();
});

let latestEmail: string | undefined;

function handleUpdate(value: { email?: string }) {
  latestEmail = value?.email;
  set(value);
}

function handleBlur() {
  if (latestEmail) updateGuestEmail({ email: latestEmail });
}
</script>
