<template>
  <div
    class="flex w-full items-center justify-between space-x-4 md:justify-end md:space-x-6"
  >
    <a class="relative z-20 md:hidden" href="/">
      <picture class="h-full w-full">
        <slot name="logo"></slot>
        <span class="sr-only">
          {{ t("header.title") }}
        </span>
      </picture>
    </a>

    <div
      class="flex items-center justify-end space-x-6 md:space-x-8"
      v-if="meta.isAvailable"
    >
      <SessionLoginPopover v-if="!meta.isAuthenticated">
        <span class="flex items-center space-x-2 text-sm">
          <span class="hidden pr-1 leading-none sm:block">
            {{ t("header.title") }}
            <strong>{{ t("header.login") }}</strong>
          </span>
          <Avatar icon="account" size="xs" />
        </span>
      </SessionLoginPopover>

      <div v-if="meta.isAuthenticated && user" class="flex items-center">
        <SessionDetailsDropdown>
          <Avatar
            v-bind="user.avatar"
            size="xs"
            color="primary"
            class="cursor-pointer"
            focusable
          />
        </SessionDetailsDropdown>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import SessionLoginPopover from "../../components/session/LoginPopover.vue";
import SessionDetailsDropdown from "../../components/session/DetailsDropdown.vue";

import { Avatar } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, user } = useSession();
</script>
