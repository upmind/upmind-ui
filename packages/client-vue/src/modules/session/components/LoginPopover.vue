<template>
  <Popover
    v-if="meta.canShowForms"
    class="w-full md:w-auto"
    @update:open="doReset"
  >
    <PopoverTrigger>
      <slot></slot>
    </PopoverTrigger>
    <PopoverContent
      class="bg-surface md:border-control-default relative z-30 mt-4 h-screen w-auto border-0 border-t p-0 text-base md:mt-8 md:h-auto md:border"
      align="end"
      data-testid="popover-content"
    >
      <div class="flex h-full flex-col md:flex-row">
        <div class="w-screen p-8 md:w-104">
          <Auth
            v-if="!meta.isAuthenticated"
            :class="styles.session.content"
            :block-tabs="blockTabs"
            :stretch-tabs="stretchTabs"
            :no-tabs="noTabs"
            :variant="variant"
            :model-value="modelValue"
            @update:model-value="doUpdate"
          >
          </Auth>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useRoutingEngine, useSession } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../session.config";

// --- components
import Auth from "./Auth.vue";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@upmind-automation/upmind-ui";

// --- types
import type { SessionProps, SessionRoutes } from "../types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SessionProps & SessionRoutes>(), {
  modelValue: "login",
  noHeader: true,
  noFooter: false,
  noTabs: true,
  blockTabs: false,
  stretchTabs: false,
  color: "primary"
});
// -----------------------------------------------------------------------------

const { meta, showLogin } = useSession();
const { navigate } = useRoutingEngine();

const styles = useStyles(["session"], props, config);

// ensure we always open with the login form
function doReset(value: boolean) {
  if (value) showLogin();
}

function doUpdate(value: SessionProps["modelValue"]) {
  if (value === "login") {
    const target = props.loginRoute.name?.toString();
    if (target) navigate(target);
  } else if (value === "register") {
    const target = props.registerRoute.name?.toString();
    if (target) navigate(target);
  } else if (value === "recover") {
    const target = props.recoverRoute.name?.toString();
    if (target) navigate(target);
  }
}
</script>
