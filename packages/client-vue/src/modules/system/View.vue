<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <template v-if="routerViewProps.Component">
        <Suspense>
          <KeepAlive>
            <Transition
              mode="out-in"
              enter-active-class="transition-opacity duration-500 ease-in-out"
              leave-active-class="transition-opacity duration-500 ease-in-out"
              enter-from-class="opacity-0"
              leave-to-class="opacity-0"
              appear
            >
              <div>
                <component :is="routerViewProps.Component" />
              </div>
            </Transition>
          </KeepAlive>

          <template #fallback>
            <Loading v-if="meta.isResolved" v-bind="props.loadingProps" />
          </template>
        </Suspense>
      </template>
    </slot>
  </RouterView>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
// --- components
import Loading from "./Loading.vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();

const { meta } = useRoutingEngine();
</script>
