<template>
  <UpmAuthRegister
    v-bind="AUTH_ROUTES"
    :templates="PORTAL_AUTH_TEMPLATES"
    @resolve="onResolve"
  />
</template>

<script setup lang="ts">
// Legacy served no registration screen at all for a brand that hides its
// registration forms (`brand/hasRegistrationEnabled`), so a client arriving by
// URL lands on the sign-in screen instead — the same in-setup redirect the
// support pillar's own guard uses, told out loud because the client asked for
// a page that exists elsewhere.
import { toast } from "@upmind/ui";
import { UpmAuthRegister } from "@upmind-automation/auth";
import { PORTAL_AUTH_TEMPLATES } from "~/portal/auth/shell";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";
import { useMockBrandGates } from "~/portal/mock/gates";

definePageMeta({
  layout: "auth"
});

const { isRegistrationEnabled } = useMockBrandGates();

if (!isRegistrationEnabled.value) {
  toast.info("Accounts here are opened by us", {
    description: "Ask your account manager and we will set one up."
  });
  void navigateTo("/login", { replace: true });
}

function onResolve() {
  return navigateTo(AUTH_LANDING);
}
</script>
