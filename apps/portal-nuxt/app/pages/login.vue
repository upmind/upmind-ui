<template>
  <UpmAuthLogin v-bind="AUTH_ROUTES" @resolve="onResolve" v-slot="{ template }">
    <component :is="authTemplate(template)" />
  </UpmAuthLogin>
</template>

<script setup lang="ts">
import { UpmAuthLogin } from "@upmind-automation/auth";
import { authTemplate } from "~/portal/auth/shell";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "auth"
});

function onResolve() {
  return navigateTo(AUTH_LANDING);
}
</script>
