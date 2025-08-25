<template>
  <nav v-if="meta.isAvailable" class="inline-flex items-center space-x-2">
    <slot name="actions" />

    <Button
      v-if="
        basketMeta.hasProducts &&
        basketMeta.isAvailable &&
        currentRoute?.name !== ROUTE.BASKET
      "
      variant="ghost"
      size="lg"
      @click="navigate(ROUTE.BASKET)"
      icon="cart"
      pill
    />

    <SessionLoginPopover v-if="!meta.isAuthenticated">
      <Button
        size="lg"
        variant="outline"
        color="base"
        :label="t('header.login')"
        icon="account"
        pill
        data-testid="login-popover-trigger"
      />
    </SessionLoginPopover>

    <SessionDetailsDropdown v-if="meta.isAuthenticated && user">
      <Avatar
        v-bind="user.avatar"
        size="md"
        class="cursor-pointer"
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
