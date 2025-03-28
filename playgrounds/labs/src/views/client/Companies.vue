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
        disabled
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
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();
</script>
