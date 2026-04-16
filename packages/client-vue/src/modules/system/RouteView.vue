<template>
  <Root>
    <slot>
      <RouterView v-slot="routerViewProps">
        <slot v-bind="routerViewProps">
          <Suspense>
            <component
              :is="routerViewProps.Component"
              @vue:mounted="doResolve"
            />

            <template #fallback>
              <Loading
                v-if="
                  (meta.isInitialRoute && meta.isResolved && shouldShow) ||
                  (!meta.isInitialRoute && shouldShow)
                "
                v-bind="props.loadingProps"
              />
            </template>
          </Suspense>
        </slot>
      </RouterView>
    </slot>
  </Root>
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
const { shouldShow, reset } = useRouteTransition();

function doResolve(el: Element) {
  emit("resolve", el);
  reset();
}
</script>
