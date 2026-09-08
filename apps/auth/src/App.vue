<template>
  <main :class="appRootVariants()">
    <RouterView />
  </main>
</template>

<script lang="ts" setup>
// The whole shell. Amendment 1 change 3 makes it app-owned, and this app owns
// almost none of it: no header, no footer, no basket summary. It fills
// `foundation`'s theme port and provides NO shell components, so every auth
// organism renders its own bare template.
import { provideThemeEngine } from "@upmind-automation/foundation";
import { useThemeAttribute } from "./useThemeAttribute";
import { appRootVariants } from "./variants";

provideThemeEngine({ set: useThemeAttribute().set });
</script>
