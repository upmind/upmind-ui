<template>
  <nav v-if="meta.isAvailable" class="inline-flex items-center space-x-2">
    <slot name="actions" />

    <Button
      v-if="
        basketMeta.hasProducts &&
        basketMeta.isAvailable &&
        currentRoute?.name !== ROUTE.BASKET
      "
      size="sm"
      variant="ghost"
      color="base"
      class="bg-background"
      @click="navigate(ROUTE.BASKET)"
    >
      <template #prepend>
        <Icon icon="cart" size="2xs" />
      </template>
    </Button>

    <SessionLoginPopover v-if="!meta.isAuthenticated">
      <Button
        size="sm"
        variant="outline"
        color="base"
        :label="t('header.login')"
        data-testid="login-popover-trigger"
      >
        <template #prepend>
          <Avatar
            icon="account"
            size="3xs"
            class="-ml-1"
            :class="styles.header.avatar.login"
          />
        </template>
      </Button>
    </SessionLoginPopover>

    <SessionDetailsDropdown v-if="meta.isAuthenticated && user">
      <Avatar
        v-bind="user.avatar"
        size="xs"
        class="h-9 w-9 cursor-pointer"
        focusable
        :class="styles.header.avatar.session"
      />
    </SessionDetailsDropdown>
  </nav>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  ROUTE,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./header.config";

// --- components
import { Icon, Button, Avatar } from "@upmind-automation/upmind-ui";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, user } = useSession();
const { meta: basketMeta } = useBasket();
const { navigate, currentRoute } = useRoutingEngine();

const styles = useStyles(["header.avatar"], {}, config) as ComputedRef<{
  header: {
    avatar: {
      login: string;
      session: string;
    };
  };
}>;
</script>
