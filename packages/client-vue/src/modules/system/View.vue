<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <template v-if="routerViewProps.Component">
        <Suspense>
          <KeepAlive>
            <Transition
              mode="out-in"
              :enter-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : ' duration-0'}`"
              :leave-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : ' duration-0'}`"
              enter-from-class="opacity-0"
              leave-to-class="opacity-0"
              appear
            >
              <div v-show="meta.isResolved">
                <component :is="routerViewProps.Component" />
              </div>
            </Transition>
          </KeepAlive>

          <template #fallback>
            <Loading
              v-if="meta.isResolved && shouldShow"
              v-bind="props.loadingProps"
            />
          </template>
        </Suspense>
      </template>
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
const { shouldShow, shouldTransition } = useRouteTransition();
</script>
