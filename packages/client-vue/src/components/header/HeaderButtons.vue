<template>
  <nav v-if="meta.isAvailable" class="inline-flex">
    <SessionLoginPopover v-if="!meta.isAuthenticated">
      <span class="flex items-center space-x-2 text-sm">
        <span class="hidden pr-1 leading-none sm:block">
          {{ t("header.title") }}
          <strong>{{ t("header.login") }}</strong>
        </span>
        <Avatar icon="account" size="xs" :class="styles.header.avatar.login" />
      </span>
    </SessionLoginPopover>

    <SessionDetailsDropdown v-if="meta.isAuthenticated && user">
      <Avatar
        v-bind="user.avatar"
        size="xs"
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
import { useSession } from "@upmind-automation/headless";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./header.config";

// --- components
import { Avatar } from "@upmind-automation/upmind-ui";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, user } = useSession();

const styles = useStyles(["header.avatar"], {}, config) as ComputedRef<{
  header: {
    avatar: {
      login: string;
      session: string;
    };
  };
}>;
</script>
