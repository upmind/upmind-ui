<template>
  <Root>
    <slot>
      <RouterView v-slot="routerViewProps">
        <slot v-bind="routerViewProps">
          <PageTransition>
            <Suspense>
              <component
                :is="routerViewProps.Component"
                @vue:mounted="doResolve($event, routerViewProps.route)"
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
          </PageTransition>
        </slot>
      </RouterView>
    </slot>
  </Root>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
import { useRoute, type RouteLocation } from "vue-router";
import { useRouteTransition } from "./useRouteTransition";

// --- components
import Root from "../../components/layout/components/root/Root.vue";
import Loading from "./Loading.vue";
import PageTransition from "../../components/layout/components/transition/Transition.vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();
const emit = defineEmits<{
  (e: "resolve", el: Element): void;
}>();

const { meta, mount } = useRoutingEngine();
const route = useRoute();
const { shouldShow, reset } = useRouteTransition();

function doResolve(el: Element, route: RouteLocation) {
  mount(route.name?.toString());
  emit("resolve", el);
  reset();
}
</script>
