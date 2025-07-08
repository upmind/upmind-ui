<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <template v-if="!meta.isAuthenticated && !meta.isLoading">
      <p class="mx-auto mt-4 w-full max-w-2xl pb-3 md:pb-3">
        <span class="font-normal"
          >{{ t(`session.${authMode}.actions.text`) }}&nbsp;</span
        >

        <Link @click="toggleAuthMode">
          {{ t(`session.${authMode}.actions.action`) }}
        </Link>
      </p>

      <Card class="mx-auto mt-4 w-full max-w-2xl pb-3 md:pb-3">
        <UpmAuth v-model="authMode" class="mt-4" />
      </Card>
    </template>

    <UpmBilling v-else />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
// --- internal
import { ref } from "vue";
import { useSession } from "@upmind-automation/headless";

// --- components
import {
  UpmBilling,
  UpmContentSection,
  UpmAuth
} from "@upmind-automation/client-vue";
import { Card, Link } from "@upmind-automation/upmind-ui";

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
</script>
