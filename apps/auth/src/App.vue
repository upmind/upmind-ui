<template>
  <main :class="appRootVariants()">
    <RouterView v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />

        <template #fallback>
          <UpmAuthLoading />
        </template>
      </Suspense>
    </RouterView>
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { UpmAuthLoading } from "@upmind-automation/auth";
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
