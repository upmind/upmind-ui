<template>
  <UpmAuthRecoverPassword v-bind="AUTH_ROUTES" />
</template>

<script setup lang="ts">
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "auth",
  middleware: "signed-in-redirect"
});
</script>
