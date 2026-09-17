<template>
  <PortalPageHost :page-keys="pageKeys" aside-label="Sign in" />
</template>

<script setup lang="ts">
// Legacy asked for the second sign-in step on the login screen ITSELF, once
// the credentials were accepted (`2faModal` over the same view). The
// dispatcher sends an account that asks for one back here with the challenge
// named, so the screen has two positions and no second route.
import { computed } from "vue";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, AUTH_QUERY_VALUE, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const route = useRoute();

const pageKeys = computed<readonly PageKey[]>(() => {
  const challenge = route.query[AUTH_QUERY_KEY.CHALLENGE];
  if (challenge === AUTH_QUERY_VALUE.TWOFA) {
    return [PAGE_KEY.AUTH_LOGIN_TWOFA];
  }
  return [PAGE_KEY.AUTH_LOGIN];
});
</script>
