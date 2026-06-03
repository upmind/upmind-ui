<template>
  <Section
    v-if="meta.isGuestClient"
    id="guest-email"
    :label="t('form.guest_email.label')"
    icon="mail-01"
  >
    <Form
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="validationErrors"
      @update:modelValue="handleUpdate"
      no-actions
      autosave
    />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession, DEBOUNCE_DELAY } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";

// --- utils
import { debounce } from "lodash-es";

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
} = useSession();

// The schema/uischema/model are owned by the client machine (a guest client's
// form layer). Driving its email form here sources them via useSession; the
// Section header labels the field, so the parser suppresses the inline label.
onMounted(() => {
  if (meta.value.isGuestClient) showGuestEmail();
});

const debouncedUpdate = debounce((email?: string) => {
  if (email) updateGuestEmail(email);
}, DEBOUNCE_DELAY);

function handleUpdate(value: { email?: string }) {
  setModel(value);
  debouncedUpdate(value?.email);
}
</script>
