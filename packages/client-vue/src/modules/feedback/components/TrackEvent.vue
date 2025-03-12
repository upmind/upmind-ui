<template>
  <span :id="`event-${message.hash}`">
    <!-- this event component has no template, its purely functional -->
  </span>
</template>

<script lang="ts" setup>
// --- external
import { inject, watch, onBeforeUnmount } from "vue";

// --- internal
import { useMessage } from "@upmind-automation/headless-vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { isFunction } from "xstate/lib/utils";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item?: ActorRef<any>;
}>();

const { message, dismiss, state } = useMessage(props.item);

const gtm = inject("gtm") as any;

watch(state, state => {
  if (!state.matches("active")) return;

  if (!gtm || !isFunction(gtm?.trackEvent)) {
    dismiss();
  } else {
    if (!isEmpty(message.value?.data)) gtm.trackEvent(message.value?.data);
    dismiss();
  }
});

onBeforeUnmount(() => {
  // dismiss the message if the component is destroyed, lets be 100% sure
  if (!state.done) dismiss();
});
</script>
