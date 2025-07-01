<template>
  <Popover v-if="!isAuthRoute && meta.canShowForms" class="w-full md:w-auto">
    <PopoverTrigger data-testid="popover-trigger">
      <slot></slot>
    </PopoverTrigger>
    <PopoverContent
      class="relative z-30 mt-4 h-screen w-auto border-0 border-t p-0 md:mt-8 md:h-auto md:border"
      align="end"
      data-testid="popover-content"
    >
      <div class="flex h-full flex-col md:flex-row">
        <div class="w-screen p-8 md:w-[26rem]">
          <Session no-header no-tabs model-value="login" color="primary" />
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

// -----------------------------------------------------------------------------

const route = useRoute();
const { meta } = useSession();

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
</script>
