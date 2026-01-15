<template>
  <UpmSessionRegister
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { UpmSessionRegister } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Registration page
useHead({
  title: "Create Account"
});

useSeoMeta({
  description: "Create a new account to get started."
});

definePageMeta({
  name: ROUTE.SESSION_REGISTER
});
</script>
