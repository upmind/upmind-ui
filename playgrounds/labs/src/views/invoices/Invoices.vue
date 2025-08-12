<template>
  <Layout variant="enclosed">
    <div v-for="invoice in invoices" :key="invoice.id">
      <Button
        size="sm"
        variant="tonal"
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
import { Layout, Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const invoices = [
  {
    id: "20e43579-5e78-d188-d92a-31643202d986"
  }
];

const { meta, userId } = useSession();
</script>
