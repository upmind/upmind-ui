<template>
  <main :class="appRootVariants()">
    <RouterView />
  </main>
</template>

<script lang="ts" setup>
// The whole shell. Amendment 1 change 3 makes it app-owned, and this app owns
// almost none of it: no header, no footer, no basket summary. It fills
// `foundation`'s theme port, and hands the auth package the seven page
// templates it can ask for.
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
