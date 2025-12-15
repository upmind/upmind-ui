<template>
  <UpmSessionRegister
    :template="template"
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal
import {
  UpmSessionRegister,
  SESSION_TEMPLATE,
  useRoutingEngine
} from "@upmind-automation/client-vue";
import { ROUTE } from "../../router";

// -----------------------------------------------------------------------------

const route = useRoute();
const template = computed(
  () =>
    (route.meta.template as SESSION_TEMPLATE) || SESSION_TEMPLATE.TWO_COLUMN_LTR
);
</script>
