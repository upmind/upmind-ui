<template>
  <nav v-if="meta.isAvailable" class="inline-flex items-center gap-3">
    <slot name="actions" />

    <Button
      as="router-link"
      variant="ghost"
      size="lg"
      :to="{ name: ROUTE.BASKET }"
      icon="shopping-bag-02"
    >
      <Transition name="label-slide">
        <i18n-t
          v-if="count > 0"
          keypath="cart.basket_count"
          scope="global"
          :plural="count"
          tag="span"
          class="hidden px-1 md:inline"
        >
          <template #[`count`]>
            <Transition name="count-slide" mode="out-in">
              <span
                :key="count"
                class="inline-block"
                :class="count < 10 ? 'min-w-2.5' : 'min-w-5'"
              >
                {{ count }}
              </span>
            </Transition>
          </template>
        </i18n-t>
      </Transition>
    </Button>

    <SessionLoginPopover v-if="!meta.isAuthenticated">
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
import { computed } from "vue";
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
import { Button, Avatar } from "@upmind-automation/upmind-ui";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, user } = useSession();
const { count } = useBasket();

const styles = useStyles(["header.avatar"], {}, config) as ComputedRef<{
  header: {
    avatar: {
      login: string;
      session: string;
      basket: string;
    };
  };
}>;
</script>

<style scoped>
.count-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.count-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.count-slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.count-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.label-slide-enter-active {
  transition: all 0.3s ease;
}

.label-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  width: 0;
  margin: 0;
  padding: 0;
}

.label-slide-enter-from,
.label-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
