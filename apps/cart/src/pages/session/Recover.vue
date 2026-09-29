<template>
  <UpmAuthRecoverPassword
    :templates="SESSION_TEMPLATES"
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #summary="summary">
      <UpmSessionSummary v-bind="summary" />
    </template>
  </UpmAuthRecoverPassword>
</template>
<script lang="ts" setup>
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import {
  SESSION_TEMPLATES,
  UpmSessionSummary
} from "@upmind-automation/client-vue";
import { ROUTE } from "../../router";
// -----------------------------------------------------------------------------
</script>
