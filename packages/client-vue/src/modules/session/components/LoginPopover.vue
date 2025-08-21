<template>
  <Popover
    v-if="!isAuthRoute && meta.canShowForms"
    class="w-full md:w-auto"
    @update:open="doReset"
  >
    <PopoverTrigger>
      <slot></slot>
    </PopoverTrigger>
    <PopoverContent
      class="relative z-30 mt-4 h-screen w-auto border-0 border-t p-0 md:mt-8 md:h-auto md:border"
      align="end"
      data-testid="popover-content"
    >
      <div class="flex h-full flex-col md:flex-row">
        <div class="w-screen p-8 md:w-104">
          <Session no-header no-tabs v-model="tab" color="primary" />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";
import { includes } from "lodash-es";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import Session from "../Session.vue";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@upmind-automation/upmind-ui";
import { ROUTE } from "@upmind-automation/headless";
import type { AuthProps } from "./types";

// -----------------------------------------------------------------------------

const route = useRoute();
const { meta, showLogin } = useSession();

const isAuthRoute = computed(() =>
  includes(
    [
      ROUTE.SESSION,
      ROUTE.SESSION_END,
      ROUTE.SESSION_LOGIN,
      ROUTE.SESSION_REGISTER,
      ROUTE.SESSION_RECOVER_PASSWORD,
      ROUTE.SESSION_TRANSFER
    ],
    route.name
  )
);

// ensure we only show login related forms
const tab = computed({
  get: (): AuthProps["modelValue"] => {
    if (meta.value.showRecoverPasswordForm) {
      return "recover";
    } else {
      return "login";
    }
  },
  set: value => {
    route.query.tab = includes(["login", "2fa", "recover"], value)
      ? value
      : "login";
  }
});

// ensure we always open with the login form
function doReset(value: boolean) {
  if (value) showLogin();
}
</script>
