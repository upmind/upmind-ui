<template>
  <div class="prose mx-auto max-w-none p-8">
    <upw-dropdown :items="items" />
  </div>
</template>

<script setup>
import { UpwDropdown } from "@upmind/upwind";

const items = {
  account: {
    href: "/account-settings",
    label: "Account settings",
    target: "_parent",
  },
  support: { href: "/support", label: "Support", target: "_parent" },
  license: { href: "/license", label: "License", target: "_parent" },
  signout: { href: "/sign-out", label: "Sign out", target: "_parent" },
  alert: { icon: "cog", label: "Alert", action: () => alert("Alert!") },
};
</script>
