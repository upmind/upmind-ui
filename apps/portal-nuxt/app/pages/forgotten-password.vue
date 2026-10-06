<template>
  <UpmAuthRecoverPassword
    v-bind="AUTH_ROUTES"
    @reject="onReject"
    v-slot="{ template }"
  >
    <component :is="authTemplate(template)" />
  </UpmAuthRecoverPassword>
</template>

<script setup lang="ts">
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { authTemplate } from "~/portal/auth/shell";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "auth"
});

function onReject() {
  return navigateTo(AUTH_ROUTES.loginRoute);
}
</script>
