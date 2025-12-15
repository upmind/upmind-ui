<template>
  <Transition
    mode="out-in"
    :enter-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : ' duration-0'}`"
    :leave-active-class="`transition-opacity ease-in-out ${shouldTransition ? 'duration-300' : ' duration-0'}`"
    enter-from-class="opacity-0"
    leave-to-class="opacity-100"
    appear
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { Transition } from "vue";
import { useRouteTransition } from "../../../../modules/system/useRouteTransition";

const { shouldTransition } = useRouteTransition();
</script>
