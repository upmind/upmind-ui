<script setup lang="ts">
// The real `@upmind-automation/auth` organism, replacing the stub this route
// carried while the surface still lived in `client-vue`. The address the login
// screen carried across in its own link opens the recovery form; the organism
// reads it from the same query key.
import { UpmSessionRecoverPassword } from "@upmind-automation/auth";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "logged-out",
  middleware: "signed-in-redirect"
});
</script>

<template>
  <UpmSessionRecoverPassword v-bind="AUTH_ROUTES" />
</template>
