<template>
  <UpmAuthLogin v-bind="AUTH_ROUTES" :landing-route="AUTH_LANDING" />
</template>

<script setup lang="ts">
import { UpmAuthLogin } from "@upmind-automation/auth";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "logged-out",
  middleware: "signed-in-redirect"
});
</script>
