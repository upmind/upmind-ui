<template>
  <UpmAuthRecoverPassword
    v-bind="AUTH_ROUTES"
    :templates="PORTAL_AUTH_TEMPLATES"
    @reject="onReject"
  />
</template>

<script setup lang="ts">
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { PORTAL_AUTH_TEMPLATES } from "~/portal/auth/shell";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "auth",
  middleware: "signed-in-redirect"
});

function onReject() {
  return navigateTo(AUTH_ROUTES.loginRoute);
}
</script>
