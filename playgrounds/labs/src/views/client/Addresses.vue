<template>
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

  <RouterView v-slot="routerViewProps" :key="$route.fullPath">
    <template v-if="routerViewProps.Component">
      <Content>
        <Transition mode="out-in">
          <KeepAlive>
            <Suspense>
              <!-- main content -->
              <component :is="routerViewProps.Component" />

              <!-- fallback / loading state -->
              <template #fallback>
                <Loading>
                  <template #background>
                    <slot name="loading-background"></slot>
                  </template>
                </Loading>
              </template>
            </Suspense>
          </KeepAlive>
        </Transition>
      </Content>
    </template>
  </RouterView>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal

// --- components
import { UpmContentSection } from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();
</script>
