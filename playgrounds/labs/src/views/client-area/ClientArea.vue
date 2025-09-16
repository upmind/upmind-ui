<template>
  <Layout variant="default">
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
  </Layout>
</template>

<script setup lang="ts">
import { Layout } from "@upmind-automation/upmind-ui";
import { UpmLoading } from "@upmind-automation/client-vue";
</script>
