<template>
  <AuthLoginPopover
    v-if="!isAuthenticated"
    :login-route="props.loginRoute"
    :register-route="props.registerRoute"
    :recover-route="props.recoverRoute"
  >
    <Button
      size="lg"
      variant="outline"
      :data-attrs="{ 'data-test-key': 'login-popover-trigger' }"
    >
      <Icon icon="user-circle" />
      <span class="hidden md:inline">{{ t("action.login") }}</span>
    </Button>
  </AuthLoginPopover>

  <AuthDetailsDropdown v-else-if="client" @register="goToRegister">
    <Avatar
      size="md"
      class="cursor-pointer"
      :data-attrs="{ 'data-test-key': 'auth-avatar' }"
      tabindex="0"
      :src="avatarSrc"
      :alt="client.avatar?.caption"
    >
      <template #fallback>
        <Icon v-if="isGuestClient" icon="user-01" />
        <template v-else>{{ client.avatar?.caption }}</template>
      </template>
    </Avatar>
  </AuthDetailsDropdown>
</template>

<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { Avatar } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/foundation";
import { useActiveSession, QUERY_PARAMS } from "@upmind-automation/headless";
import AuthDetailsDropdown from "./components/DetailsDropdown.vue";
import AuthLoginPopover from "./components/LoginPopover.vue";
import { assign } from "lodash-es";
import type { AuthActionProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<AuthActionProps>();

const { t } = useI18n();
const session = useActiveSession();
const { isAuthenticated, isGuestClient } = session.useMeta();
const { activeUser: client } = session.useContext();

const avatarSrc = computed(() => {
  if (isGuestClient.value) return undefined;
  if (client.value?.avatar?.forceCaption) return undefined;
  return client.value?.avatar?.src;
});
const router = useRouter();
const route = useRoute();

function goToRegister() {
  if (!props.registerRoute) return;
  router.push(
    assign({}, props.registerRoute, {
      query: assign({}, props.registerRoute.query, {
        [QUERY_PARAMS.RETURN_URL]: route.fullPath
      })
    })
  );
}
</script>
