<template>
  <span :id="`event-${message.hash}`">
    <!-- this event component has no template, its purely functional -->
  </span>
</template>
<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useMessage } from "@upmind-automation/headless-vue";

// --- utils
import { isEmpty } from "lodash-es";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "TrackEvent",
  props: {
    item: {
      type: object, // xstate actor
      required: true,
    },
  },
  setup(props) {
    const { message, dismiss, state } = useMessage(props.item);
    return {
      message,
      dismiss,
      state,
    };
  },
  watch: {
    state: {
      immediate: true,
      handler(state) {
        if (!state.matches("active")) return;
        if (!this.$gtm) {
          this.dismiss();
        } else {
          if (!isEmpty(this.message?.data))
            this.$gtm.trackEvent(this.message?.data);
          this.dismiss();
        }
      },
    },
  },
  beforeUnmount() {
    // dismiss the message if the component is destroyed, lets be 100% sure
    if (!this.state.done) this.dismiss();
  },
});
</script>
