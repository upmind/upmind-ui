<template>
  <Banner
    v-if="isImpersonated"
    color="warning"
    :text="impersonationText"
    @action="logout"
  >
    <span class="inline-flex items-center gap-2">
      <span>You're currently impersonating</span>
      <strong>{{ activeUser?.fullName }}</strong>
      <small> ( {{ activeUser?.email }} ) </small>

      <Button variant="ghost" @click="logout" icon-append="log-out-01"
        >End impersonation</Button
      >
    </span>
  </Banner>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useActiveSession } from "@upmind-automation/headless";
import { Banner, Button } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const session = useActiveSession();
const { activeUser } = session.useContext();
const { isImpersonated } = session.useMeta();
const { logout } = session.useActions();

const impersonationText = computed(() => {
  const user = activeUser.value;
  const name = user?.fullName || user?.publicName || "";
  const email = user?.email ? ` (${user.email})` : "";
  return `You're currently impersonating ${name}${email} — click to end.`;
});
</script>
