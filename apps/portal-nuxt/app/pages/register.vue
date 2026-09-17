<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.AUTH_REGISTER]"
    aside-label="Create an account"
  />
</template>

<script setup lang="ts">
// Legacy served no registration screen at all for a brand that hides its
// registration forms (`brand/hasRegistrationEnabled`), so a client arriving by
// URL lands on the sign-in screen instead — the same in-setup redirect the
// support pillar's own guard uses, told out loud because the client asked for
// a page that exists elsewhere.
import { toast } from "@upmind/ui";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const { isRegistrationEnabled } = useMockBrandGates();

if (!isRegistrationEnabled.value) {
  toast.info("Accounts here are opened by us", {
    description: "Ask your account manager and we will set one up."
  });
  void navigateTo("/login", { replace: true });
}
</script>
