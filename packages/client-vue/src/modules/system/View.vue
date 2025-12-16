<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <Suspense>
        <KeepAlive>
          <component
            v-show="isMounted"
            :is="routerViewProps.Component"
            @vue:mounted="doResolve"
          />
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
import { ref, watch } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();
const emit = defineEmits<{
  (e: "resolve", el: Element): void;
}>();

const isMounted = ref(false);
const { meta } = useRoutingEngine();
const { shouldShow } = useRouteTransition();

watch(
  () => meta.value.isResolved,
  value => {
    if (!value) isMounted.value = false;
  },
  { immediate: true }
);

function doResolve(el: Element) {
  isMounted.value = true;
  emit("resolve", el);
}
</script>
