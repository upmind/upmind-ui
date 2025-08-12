<template>
  <Layout variant="enclosed">
    <template #controls>
      <div class="flex w-full flex-col items-center justify-between gap-4">
        <div class="flex flex-col justify-center gap-2 md:flex-row">
          <Button
            size="sm"
            variant="tonal"
            label="Addresses"
            @click.prevent="router.push({ name: 'client.addresses' })"
          >
          </Button>
          <Button
            size="sm"
            variant="tonal"
            label="Emails"
            @click.prevent="router.push({ name: 'client.emails' })"
          >
          </Button>
          <Button
            size="sm"
            variant="tonal"
            label="Phones"
            @click.prevent="router.push({ name: 'client.phones' })"
          >
          </Button>
          <Button
            size="sm"
            variant="tonal"
            label="Companies"
            @click.prevent="router.push({ name: 'client.companies' })"
          >
          </Button>
        </div>

        <Alert
          v-if="!meta.isAuthenticated && !meta.isLoading"
          color="error"
          title="Please log in to use client companies"
        />
      </div>
    </template>

    <RouterView
      v-slot="{ Component }"
      :key="$route.fullPath"
      v-if="meta.isAuthenticated && !!userId"
    >
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

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { UpmLoading } from "@upmind-automation/client-vue";

import { Layout, Button, Alert } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const { meta, userId } = useSession();
</script>
