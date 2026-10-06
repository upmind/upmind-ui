<template>
  <UpmAuthLogin v-bind="props" v-slot="{ template }">
    <component :is="authTemplate(template)" />
  </UpmAuthLogin>
</template>

<script lang="ts" setup>
import { UpmAuthLogin } from "@upmind-automation/auth";
import { authTemplate } from "../shell";
import type { AuthRoutes } from "@upmind-automation/auth";

const props = defineProps<AuthRoutes>();
</script>
