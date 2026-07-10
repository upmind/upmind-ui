<template>
  <Popover v-if="canShowForms" class="w-full md:w-auto" @update:open="doReset">
    <PopoverTrigger>
      <slot></slot>
    </PopoverTrigger>
    <PopoverContent
      class="bg-surface md:border-control-default relative z-30 mt-4 h-screen w-auto border-0 border-t p-0 text-base md:mt-8 md:h-auto md:border"
      align="end"
    >
      <div class="flex h-full flex-col md:flex-row">
        <div class="w-screen p-8 md:w-104">
          <Auth
            v-if="!isAuthenticated"
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
import { computed } from "vue";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useActiveSession,
  useAuth,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@upmind-automation/upmind-ui";
import config from "../session.config";
import Auth from "./Auth.vue";
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

const { isAuthenticated, isGuestClient } = useActiveSession().useMeta();
const auth = useAuth().as(ScopeActorTypes.CLIENT);
const { start } = auth.useActions();
const { canShowForms: authCanShowForms } = auth.useMeta();

const canShowForms = computed(
  () => authCanShowForms.value || isGuestClient.value
);
const { navigate } = useRoutingEngine();

const styles = useStyles(["session"], props, config);

// ensure we always open with the login form
function doReset(value: boolean) {
  if (value) start(AuthFlowTypes.LOGIN);
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
