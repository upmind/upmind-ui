<template>
  <SessionLoginPopover
    v-if="!meta.isAuthenticated"
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
      :icon="meta.isGuestClient ? 'user-01' : undefined"
      :shape="shape"
      size="lg"
      class="cursor-pointer"
      focusable
    />
  </SessionDetailsDropdown>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { Button, Avatar } from "@upmind-automation/upmind-ui";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";

// --- types
import type { AuthActionProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<AuthActionProps>();

const { t } = useI18n();
const { meta, client } = useSession();
const router = useRouter();

function goToRegister() {
  if (props.registerRoute) router.push(props.registerRoute);
}
</script>
