<template>
  <nav
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
        <Avatars size="xs" color="primary" class="cursor-pointer" focusable />
      </SessionDetailsDropdown>
    </div>
  </nav>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import SessionLoginPopover from "../../modules/session/components/LoginPopover.vue";
import SessionDetailsDropdown from "../../modules/session/components/DetailsDropdown.vue";

import { Avatar } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, user } = useSession();

const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
</script>
