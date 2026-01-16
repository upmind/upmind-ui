<template>
  <UpmLayout :variant="LAYOUT_VARIANTS.CANVAS_CARD">
    <div v-for="invoice in invoices" :key="invoice.id">
      <Button
        size="sm"
        variant="subtle"
        :label="invoice.id"
        @click.prevent="
          router.push({ name: 'invoice', query: { id: invoice.id } })
        "
      >
      </Button>
    </div>

    <RouterView
      v-slot="{ Component }"
      :key="$route.fullPath"
      v-if="meta.isAuthenticated && !!clientId"
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
  LAYOUT_VARIANTS
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const invoices = [
  {
    id: "20e43579-5e78-d188-d92a-31643202d986"
  }
];

const { meta, clientId } = useSession();
</script>
