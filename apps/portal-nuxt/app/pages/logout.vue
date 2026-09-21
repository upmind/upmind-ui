<template>
  <div />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module pages/logout
 * @description Signing out is a VERB, not a screen. The page ends the session
 * and replaces itself with the sign-in form.
 *
 * It takes NO layout: the logged-out chrome would paint a brand row, an empty
 * card and a footer for the one frame between arriving and leaving, which reads
 * as a "you are signed out" page nobody asked for. `replace` keeps it out of
 * the history, so Back from the login form does not sign the client in again.
 */
import { useActiveSession } from "@upmind-automation/headless";
import { AUTH_ROUTES } from "~/portal/auth-routes";

definePageMeta({ layout: false });

const { logout } = useActiveSession().useActions();

logout();

await navigateTo(AUTH_ROUTES.loginRoute, { replace: true });
</script>
