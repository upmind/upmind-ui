<script setup lang="ts">
// The real `@upmind-automation/auth` organism, replacing the stub this route
// carried while the surface still lived in `client-vue`.
//
// Legacy served no registration screen at all for a brand that hides its
// registration forms (`brand/hasRegistrationEnabled`), so a client arriving by
// URL lands on the sign-in screen instead — the same in-setup redirect the
// support pillar's own guard uses, told out loud because the client asked for
// a page that exists elsewhere.
import { toast } from "@upmind/ui";
import { UpmSessionRegister } from "@upmind-automation/auth";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";
import { useMockBrandGates } from "~/portal/mock/gates";

definePageMeta({
  layout: "logged-out",
  middleware: "signed-in-redirect"
});

const { isRegistrationEnabled } = useMockBrandGates();

if (!isRegistrationEnabled.value) {
  toast.info("Accounts here are opened by us", {
    description: "Ask your account manager and we will set one up."
  });
  void navigateTo("/login", { replace: true });
}
</script>

<template>
  <UpmSessionRegister v-bind="AUTH_ROUTES" :landing-route="AUTH_LANDING" />
</template>
