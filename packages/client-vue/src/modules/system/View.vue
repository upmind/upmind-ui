<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <Suspense>
        <KeepAlive>
          <component :is="routerViewProps.Component" />
        </KeepAlive>

        <template #fallback>
          <Loading
            v-if="meta.isResolved && shouldShow"
            v-bind="props.loadingProps"
          />
        </template>
      </Suspense>
    </slot>
  </RouterView>
</template>

<script lang="ts" setup>
// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
import { useRouteTransition } from "./useRouteTransition";

// --- components
import Loading from "./Loading.vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();

const { meta } = useRoutingEngine();
const { shouldShow } = useRouteTransition();
</script>
