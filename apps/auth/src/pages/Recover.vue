<template>
  <UpmAuthRecoverPassword v-bind="props" v-slot="{ template }">
    <component :is="authTemplate(template)" />
  </UpmAuthRecoverPassword>
</template>

<script lang="ts" setup>
import { UpmAuthRecoverPassword } from "@upmind-automation/auth";
import { authTemplate } from "../shell";
import type { AuthRoutes } from "@upmind-automation/auth";

const props = defineProps<AuthRoutes>();
</script>
