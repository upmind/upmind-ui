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
      @update:modelValue="handleUpdate"
      no-actions
      autosave
    />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";

// --- utils
import { debounce } from "lodash-es";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { client, meta, updateGuestEmail } = useSession();

const model = ref<{ email: string }>({ email: client.value?.email ?? "" });

const schema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email"
    }
  }
};

// The Section header already labels this field ("Email for order
// confirmation"), so the Control suppresses its own label and i18n-driven
// hint (label: "" + no i18n) — only the placeholder remains. Mirrors the
// 2FA token field pattern in Auth.vue.
const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/email",
      label: "",
      options: {
        autocomplete: "email",
        placeholder: "name@email.com"
      }
    }
  ]
};

const debouncedUpdate = debounce((email: string) => {
  if (email) {
    updateGuestEmail(email);
  }
}, 500);

function handleUpdate(value: { email: string }) {
  model.value = value;
  debouncedUpdate(value.email);
}
</script>
