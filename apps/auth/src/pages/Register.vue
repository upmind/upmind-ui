<template>
  <UpmAuthRegister v-bind="props" v-slot="{ template }">
    <component :is="authTemplate(template)" />
  </UpmAuthRegister>
</template>

<script lang="ts" setup>
import { UpmAuthRegister } from "@upmind-automation/auth";
import { authTemplate } from "../shell";
import type { AuthRoutes } from "@upmind-automation/auth";

const props = defineProps<AuthRoutes>();
</script>
