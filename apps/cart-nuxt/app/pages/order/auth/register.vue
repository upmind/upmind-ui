<template>
  <UpmSessionRegister
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmSessionRegister } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.SESSION_REGISTER
});
</script>
