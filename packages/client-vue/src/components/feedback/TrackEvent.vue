<template>
  <span :id="`event-${message.hash}`">
    <!-- this event component has no template, its purely functional -->
  </span>
</template>
<script lang="ts" setup>
// --- external
import { watch, inject, onBeforeUnmount } from "vue";

// --- internal
import { useMessage } from "@upmind-automation/headless-vue";

// --- utils
import { isEmpty } from "lodash-es";
// -----------------------------------------------------------------------------

const props = defineProps({
  item: {
    type: Object, // xstate actor
    required: true,
  },
});

const { message, dismiss, state } = useMessage(props.item);

const $gtm = inject("gtm");

watch(state, state => {
  if (!state.matches("active")) return;
  if (!$gtm) {
    dismiss();
  } else {
    if (!isEmpty(message?.data)) $gtm.trackEvent(message?.data);
    dismiss();
  }
});

onBeforeUnmount(() => {
  // dismiss the message if the component is destroyed, lets be 100% sure
  if (!state.done) dismiss();
});
</script>
