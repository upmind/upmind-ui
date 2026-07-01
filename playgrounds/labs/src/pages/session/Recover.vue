<template>
  <UpmSessionRecoverPassword
    :login-route="{ name: ROUTE.SESSION_LOGIN }"
    :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>
<script lang="ts" setup>
import { UpmSessionRecoverPassword } from "@upmind-automation/client-vue";
import { ROUTE } from "../../funnels";
// -----------------------------------------------------------------------------
</script>
