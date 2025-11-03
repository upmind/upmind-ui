<template>
  <UpmSection class="max-w-app mx-auto" label="Addresses">
    <template v-if="!meta.isAuthenticated && !meta.isLoading">
      <p class="mx-auto mt-4 w-full max-w-2xl pb-3 md:pb-3">
        <span class="font-normal">{{ getText(authMode) }}&nbsp;</span>

        <Button @click="toggleAuthMode" variant="link">
          {{ getAction(authMode) }}
        </Button>
      </p>

      <Card class="mx-auto mt-4 w-full max-w-2xl pb-3 md:pb-3">
        <UpmAuth v-model="authMode" class="mt-4" />
      </Card>
    </template>

    <UpmBilling v-else :as="Card" />
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
// --- internal
import { ref } from "vue";
import { useSession } from "@upmind-automation/headless";

// --- components
import { UpmBilling, UpmSection, UpmAuth } from "@upmind-automation/client-vue";
import { Card, Button } from "@upmind-automation/upmind-ui";

// --- types
import type { AuthProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { meta } = useSession();

const authMode = ref<AuthProps["modelValue"]>("register");

function toggleAuthMode() {
  switch (authMode.value) {
    case "login":
      authMode.value = "register";
      break;
    case "register":
      authMode.value = "login";
      break;
  }
}

function getText(key: "login" | "register") {
  switch (key) {
    case "login":
      return t("auth.no_account_qn");
    case "register":
      return t("auth.already_have_account_qn");
  }
}

function getAction(key: "login" | "register") {
  switch (key) {
    case "login":
      return t("action.create_one_here");
    case "register":
      return t("action.log_in_here");
  }
}
</script>
