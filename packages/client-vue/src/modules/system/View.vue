<template>
  <RouterView v-slot="routerViewProps" :key="$route.path">
    <slot v-bind="routerViewProps">
      <template v-if="routerViewProps.Component">
        <Suspense>
          <KeepAlive>
            <Transition
              mode="out-in"
              :enter-active-class="`transition-opacity ease-in-out ${shouldShow ? 'duration-300' : ' duration-0'}`"
              :leave-active-class="`transition-opacity ease-in-out ${shouldShow ? 'duration-300' : ' duration-0'}`"
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
// --- external
import { watch, ref } from "vue";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
import { useRoute } from "vue-router";
// --- components
import Loading from "./Loading.vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  loadingProps?: InterstitialProps;
}>();

const { meta } = useRoutingEngine();
const route = useRoute();

const shouldShow = ref(false);

watch(
  route,
  newVal => {
    shouldShow.value = newVal.path !== route.path;

    setTimeout(() => {
      shouldShow.value = true;
    }, 600);
  },
  { immediate: true }
);
</script>
