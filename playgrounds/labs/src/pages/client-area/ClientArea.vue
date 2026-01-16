<template>
  <UpmLayout :layout="LAYOUT_VARIANTS.FULL">
    <template #controls>
      <RouterLink
        :to="{ name: 'client-area.slots' }"
        active-class="font-bold underline pointer-events-none"
      >
        Slots
      </RouterLink>
    </template>

    <RouterView v-slot="{ Component }" :key="$route.fullPath">
      <template v-if="Component">
        <KeepAlive>
          <Suspense>
            <!-- main content -->
            <component :is="Component" view-prop="value" />

            <!-- fallback / loading state -->
            <template #fallback>
              <UpmLoading>
                <template #background>
                  <slot name="loading-background"></slot>
                </template>
              </UpmLoading>
            </template>
          </Suspense>
        </KeepAlive>
      </template>
    </RouterView>
  </UpmLayout>
</template>

<script setup lang="ts">
import { LAYOUT_VARIANTS, UpmLayout } from "@upmind-automation/client-vue";
import { UpmLoading } from "@upmind-automation/client-vue";
</script>
