<template>
  <div />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module pages/logout
 * @description Ends the session and replaces itself with the sign-in form.
 */
import { useActiveSession } from "@upmind-automation/headless";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({ layout: false });

const { logout } = useActiveSession().useActions();

logout();

await navigateTo(AUTH_ROUTES.loginRoute, { replace: true });
</script>
