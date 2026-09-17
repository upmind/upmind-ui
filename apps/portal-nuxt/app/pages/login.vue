<template>
  <UpmAuthLogin v-bind="AUTH_ROUTES" :landing-route="AUTH_LANDING" />
</template>

<script setup lang="ts">
// The real `@upmind-automation/auth` organism, replacing the stub this route
// carried while the surface still lived in `client-vue`
// (`portal/config/client-vue.ts`). Legacy asked for the second sign-in step on
// the login screen ITSELF once the credentials were accepted; the organism's
// own 2FA interstitial is that position, so the screen still has no second
// route. This app provides no shell components, so the organism renders its
// bare template inside the logged-out layout's card.
import { UpmAuthLogin } from "@upmind-automation/auth";
import { AUTH_LANDING, AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({
  layout: "logged-out",
  middleware: "signed-in-redirect"
});
</script>
