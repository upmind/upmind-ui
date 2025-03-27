<template>
  <div>
    <UpmContentSection class="mx-auto max-w-app" class-content="gap-2 flex">
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        label="Addresses"
        @click.prevent="router.push({ name: 'client.addresses.listings' })"
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
    </UpmContentSection>

    <RouterView v-slot="{ Component }" :key="$route.fullPath">
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
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import {
  UpmContentSection,
  UpmLoading,
  UpmContent,
} from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();
</script>
