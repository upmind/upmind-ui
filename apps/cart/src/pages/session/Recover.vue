<template>
  <UpmAuthRecoverPassword
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #default="{ template }">
      <component :is="sessionTemplate(template)" />
    </template>
    <template #summary="summary">
      <SessionSummary v-bind="summary" />
    </template>
  </UpmAuthRecoverPassword>
</template>
<script lang="ts" setup>
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { ROUTE } from "../../router";
import SessionSummary from "../../shell/modules/session/components/SessionSummary.vue";
import { sessionTemplate } from "../../shell/modules/session/shell";
// -----------------------------------------------------------------------------
</script>
