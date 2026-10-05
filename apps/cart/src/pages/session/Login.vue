<template>
  <UpmAuthLogin
    :templates="SESSION_TEMPLATES"
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #loading><UpmLoading /></template>
    <template #summary="summary">
      <SessionSummary v-bind="summary" />
    </template>
  </UpmAuthLogin>
</template>
<script lang="ts" setup>
import { UpmAuthLogin } from "@upmind-automation/auth";
import { ROUTE } from "../../router";
import SessionSummary from "../../shell/modules/session/components/SessionSummary.vue";
import { SESSION_TEMPLATES } from "../../shell/modules/session/shell";
import UpmLoading from "../../shell/modules/system/Loading.vue";
</script>
