<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <template v-if="routerViewProps.Component">
        <Suspense>
          <KeepAlive>
            <component :is="routerViewProps.Component" />
          </KeepAlive>
          <template #fallback>
            <UpmLoading v-if="!meta.isResolved" />
          </template>
        </Suspense>
      </template>
    </slot>
  </RouterView>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useRoutingEngine } from "@upmind-automation/client-vue";
// --- components
import { UpmLoading } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useRoutingEngine();
</script>
