<template>
  <RouterView v-slot="routerViewProps" :key="$route.fullPath">
    <slot v-bind="routerViewProps">
      <template v-if="routerViewProps.Component">
        <Suspense>
          <KeepAlive>
            <component :is="routerViewProps.Component" />
          </KeepAlive>
          <template #fallback>
            <UpmLoading />
          </template>
        </Suspense>
      </template>
    </slot>
  </RouterView>
</template>

<script lang="ts" setup>
// --- external

// --- internal

// --- components
import { UpmLoading } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
</script>
