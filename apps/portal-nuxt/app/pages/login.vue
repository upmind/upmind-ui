<template>
  <UpmAuthLogin
    v-bind="AUTH_ROUTES"
    :templates="PORTAL_AUTH_TEMPLATES"
    @resolve="onResolve"
  />
</template>

<script setup lang="ts">
import { UpmAuthLogin } from "@upmind-automation/auth";
import { PORTAL_AUTH_TEMPLATES } from "~/portal/auth/shell";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "auth",
  middleware: "signed-in-redirect"
});

function onResolve() {
  return navigateTo(AUTH_LANDING);
}
</script>
