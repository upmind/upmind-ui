<template>
  <UpmAuthRegister
    :templates="SESSION_TEMPLATES"
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  >
    <template #loading><UpmLoading /></template>
    <template #summary="summary">
      <UpmSessionSummary v-bind="summary" />
    </template>
    <template #guest-checkout="offer">
      <UpmGuestCheckoutOffer v-bind="offer" />
    </template>
  </UpmAuthRegister>
</template>
<script lang="ts" setup>
import { UpmAuthRegister } from "@upmind-automation/auth";
import {
  SESSION_TEMPLATES,
  UpmGuestCheckoutOffer,
  UpmLoading,
  UpmSessionSummary
} from "@upmind-automation/client-vue";
import { ROUTE } from "../../router";
</script>
