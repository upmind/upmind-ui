<template>
  <Root>
    <slot>
      <RouterView v-slot="routerViewProps">
        <slot v-bind="routerViewProps">
          <PageTransition>
            <Suspense>
              <component
                v-if="meta.isResolved || !meta.isInitialRoute"
                :is="routerViewProps.Component"
                @vue:beforeMount="doPageStart"
                @vue:mounted="doPageFinish($event, routerViewProps.route)"
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
import { Root } from "@upmind-automation/foundation";
import { useLayout } from "@upmind-automation/foundation";
import { SHELL } from "@upmind-automation/foundation";
import { useShell } from "@upmind-automation/foundation";
import { useRoutingEngine } from "@upmind-automation/headless";
import { useFooter } from "../../components/footer/useFooter";
import { useHeader } from "../../components/header/useHeader";
import PageTransition from "../../components/transition/Transition.vue";
import Loading from "./Loading.vue";
import { useRouteTransition } from "./useRouteTransition";
import type { RouteViewProps } from "./types";
import type { RouteLocation } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<RouteViewProps>();
const emit = defineEmits<{
  (e: "resolve", el: Element): void;
}>();

const { meta, mount } = useRoutingEngine();
const { shouldShow } = useRouteTransition();

const shell = useShell();

function doPageStart() {
  shell.reset();
}

function doPageFinish(el: Element, route: RouteLocation) {
  if (!shell.has(SHELL.HEADER)) useHeader({});
  if (!shell.has(SHELL.FOOTER)) useFooter({});
  if (!shell.has(SHELL.LAYOUT)) useLayout({});

  mount(route.name?.toString());
  emit("resolve", el);
}
</script>
