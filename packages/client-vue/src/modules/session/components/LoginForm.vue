<template>
  <Section :active="section" label="Login" icon="user-03">
    <Auth
      class="rounded-box w-full max-w-5xl items-start"
      no-tabs
      no-header
      model-value="login"
      @update:model-value="doUpdate"
      @resolve="doResolve"
    />
  </Section>
</template>

<script lang="ts" setup>
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless";
import Auth from "../components/Auth.vue";
import Section from "../../../components/section/Section.vue";
import type { AuthProps } from "../types";

interface Props {
  section?: boolean;
}

withDefaults(defineProps<Props>(), {
  section: false
});

const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();

await isResolved(ROUTE.SESSION_LOGIN);

function doUpdate(value: AuthProps["modelValue"]) {
  if (value === "login") {
    navigate(ROUTE.SESSION_LOGIN);
  } else if (value === "register") {
    navigate(ROUTE.SESSION_REGISTER);
  } else if (value === "recover") {
    navigate(ROUTE.SESSION_RECOVER_PASSWORD);
  }
}

function doReject() {
  navigateBack();
}

function doResolve() {
  navigateNext();
}
</script>
