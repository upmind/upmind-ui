<template>
  <main :class="appRootVariants()">
    <RouterView v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </RouterView>
  </main>
</template>

<script lang="ts" setup>
import { watchEffect } from "vue";
import { useBrand, useConfig } from "@upmind-automation/headless";
import { appRootVariants } from "./variants";

const { brandId } = useBrand();
const { ui } = useConfig();

watchEffect(() => {
  const themeId = ui.theme.value;

  if (brandId.value && themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
  }
});
</script>
