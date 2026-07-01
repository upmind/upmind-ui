<template>
  <SessionLoginPopover
    v-if="!isAuthenticated"
    :login-route="props.loginRoute"
    :register-route="props.registerRoute"
    :recover-route="props.recoverRoute"
  >
    <Button
      size="lg"
      variant="outline"
      :label="t('action.login')"
      icon="user-circle"
      data-testid="login-popover-trigger"
      :ui-config="{
        button: {
          label: ['hidden md:inline']
        } as any
      }"
    />
  </SessionLoginPopover>

  <SessionDetailsDropdown v-else-if="client" @register="goToRegister">
    <Avatar
      v-bind="client.avatar"
      :icon="isGuestClient ? 'user-01' : undefined"
      :shape="shape"
      size="lg"
      class="cursor-pointer"
      data-testid="auth-avatar"
      focusable
    />
  </SessionDetailsDropdown>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useActiveSession, QUERY_PARAMS } from "@upmind-automation/headless";
import { Button, Avatar } from "@upmind-automation/upmind-ui";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import type { AuthActionProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<AuthActionProps>();

const { t } = useI18n();
const session = useActiveSession();
const { isAuthenticated, isGuestClient } = session.useMeta();
const { activeUser: client } = session.useContext();
const router = useRouter();
const route = useRoute();

function goToRegister() {
  if (!props.registerRoute) return;
  router.push({
    ...props.registerRoute,
    query: {
      ...props.registerRoute.query,
      [QUERY_PARAMS.RETURN_URL]: route.fullPath
    }
  });
}
</script>
