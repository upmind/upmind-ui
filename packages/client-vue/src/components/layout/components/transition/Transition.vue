<template>
  <Transition
    :enter-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : 'duration-0'}`"
    enter-from-class="opacity-0"
    mode="out-in"
    appear
    @enter="onEnter"
  >
    <!-- added a wrapping div to ensure a single transition node -->
    <div><slot /></div>
  </Transition>
</template>

<script setup lang="ts">
import { Transition } from "vue";
import { useRouteTransition } from "../../../../modules/system/useRouteTransition";

const { onEnter, shouldTransition } = useRouteTransition();
</script>
