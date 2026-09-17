<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.AUTH_REGISTER_ORG]"
    aside-label="Register an organisation"
  />
</template>

<script setup lang="ts">
// Legacy served the organisation-registration screen only from its own org
// context (`views/client/auth/registerOrg`); every other brand's visitor is
// opening a client account, so an arrival by URL lands on the client
// registration screen instead — the same in-setup redirect the register page
// itself uses when a brand hides its forms.
import { toast } from "@upmind/ui";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const { isOrgRegistrationEnabled } = useMockBrandGates();

if (!isOrgRegistrationEnabled.value) {
  toast.info("Organisations are not opened here", {
    description: "You can open a client account instead."
  });
  void navigateTo("/register", { replace: true });
}
</script>
