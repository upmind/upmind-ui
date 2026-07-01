<template>
  <Transition
    :enter-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : 'duration-0'}`"
    enter-from-class="opacity-0"
    mode="out-in"
    appear
    @enter="onEnter"
  >
    <!-- wrapper ensures a single transition root; matches the outer Root flex chain so `grow` propagates -->
    <div class="flex w-full grow flex-col"><slot /></div>
  </Transition>
</template>

<script setup lang="ts">
import { useRouteTransition } from "../../../../modules/system/useRouteTransition";

const { onEnter, shouldTransition } = useRouteTransition();
</script>
