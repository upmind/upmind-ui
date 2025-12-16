<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <Suspense>
        <Root>
          <KeepAlive>
            <component
              :is="routerViewProps.Component"
              @vue:mounted="doResolve"
            />
          </KeepAlive>
        </Root>

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
import Root from "../../components/layout/components/root/Root.vue";
import Loading from "./Loading.vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();
const emit = defineEmits<{
  (e: "resolve", el: Element): void;
}>();

const { meta } = useRoutingEngine();
const { shouldShow } = useRouteTransition();

function doResolve(el: Element) {
  emit("resolve", el);
}
</script>
