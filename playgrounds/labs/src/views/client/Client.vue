<template>
  <UpmLayout variant="enclosed">
    <template #controls>
      <UpmContentSection class="mx-auto max-w-app" class-content="gap-2 flex">
        <Button
          type="reset"
          class="relative -top-4 md:-top-6"
          size="sm"
          variant="tonal"
          label="Addresses"
          @click.prevent="router.push({ name: 'client.addresses' })"
        >
        </Button>
        <Button
          type="reset"
          class="relative -top-4 md:-top-6"
          size="sm"
          variant="tonal"
          label="Emails"
          @click.prevent="router.push({ name: 'client.emails' })"
        >
        </Button>
        <Button
          type="reset"
          class="relative -top-4 md:-top-6"
          size="sm"
          variant="tonal"
          label="Phones"
          @click.prevent="router.push({ name: 'client.phones' })"
        >
        </Button>
        <Button
          type="reset"
          class="relative -top-4 md:-top-6"
          size="sm"
          variant="tonal"
          label="Companies"
          @click.prevent="router.push({ name: 'client.companies' })"
        >
        </Button>

        <Alert
          v-if="!meta.isAuthenticated && !meta.isLoading"
          color="error"
          title="Please log in to use client companies"
        />
      </UpmContentSection>
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
  </UpmLayout>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import {
  UpmLoading,
  UpmLayout,
  UpmContentSection
} from "@upmind-automation/client-vue";

import { Button, Alert } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const { meta, userId } = useSession();
</script>
