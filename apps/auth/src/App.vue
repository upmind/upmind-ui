<template>
  <main :class="appRootVariants()">
    <RouterView />
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  provideShellComponents,
  provideThemeEngine
} from "@upmind-automation/foundation";
import { AUTH_SHELL_COMPONENTS } from "./shell";
import { useThemeAttribute } from "./useThemeAttribute";
import { appRootVariants } from "./variants";

provideThemeEngine({ set: useThemeAttribute().set });

provideShellComponents(computed(() => AUTH_SHELL_COMPONENTS));
</script>
