<template>
  <article>
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

    <RouterView
      v-slot="{ Component }"
      :key="$route.fullPath"
      v-if="meta.isAuthenticated && !!userId"
    >
      <template v-if="Component">
        <UpmContent>
          <Transition mode="out-in">
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
          </Transition>
        </UpmContent>
      </template>
    </RouterView>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal

// --- components
import {
  UpmLoading,
  UpmContent,
  UpmContentSection,
  useSession,
} from "@upmind-automation/client-vue";

import { Button, Alert } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

const { meta, userId } = useSession();
</script>
