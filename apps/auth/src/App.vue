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
import { watchEffect } from "vue";
import { UpmAuthLoading } from "@upmind-automation/auth";
import { useBrand, useConfig } from "@upmind-automation/headless";
import { useThemeAttribute } from "./useThemeAttribute";
import { appRootVariants } from "./variants";

const { set } = useThemeAttribute();

const { brandId } = useBrand();
// `basket: undefined` opts out of the per-user basket wiring.
const { ui } = useConfig({ basket: undefined });

watchEffect(() => {
  const themeId = ui.theme.value;

  if (brandId.value && themeId) set(themeId);
});
</script>
