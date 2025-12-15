<template>
  <Transition
    :enter-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-1000' : 'duration-0'}`"
    enter-from-class="opacity-0"
    appear
    @enter="onEnter"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { Transition } from "vue";
import { useRouteTransition } from "../../../../modules/system/useRouteTransition";

const { onEnter, shouldTransition } = useRouteTransition();
</script>
