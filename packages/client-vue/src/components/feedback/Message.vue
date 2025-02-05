<template>
  <Alert
    v-bind="message"
    :model-value="meta.isActive || (scheduled && meta.isScheduled)"
    :icon="message.icon"
    :title="message.title"
    :description="message.copy"
    :data="message.data"
    :color="message.type"
    :anchor="safeAnchor"
    :variant="variant"
    @reject="dismiss(message.hash)"
  />
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useMessage } from "@upmind-automation/headless-vue";

// custom elements
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils
import { useTimestamp } from "@vueuse/core";
import { utils } from "@upmind-automation/headless";
import { endsWith, startsWith } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Message",
  components: {
    Alert,
  },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
    scheduled: {
      type: Boolean,
      default: false,
    },
    anchor: {
      type: String,
    },
    variant: {
      type: String,
      default: "inline",
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const timestamp = useTimestamp();

    const { state, message, meta, dismiss } = useMessage(props.item);

    return {
      state,
      message,
      meta,
      dismiss,
      timestamp,
    };
  },
  computed: {
    hidesIn() {
      if (!this.message.maxAge) {
        return "";
      }

      const time = utils.useRelativeTime(
        this.message.scheduled + this.message.maxAge,
        this.timestamp
      );

      if (endsWith(time, " ago")) return `Hidden ${time}`;
      else if (startsWith(time, "in ")) return `Hides ${time}`;
      else return `Hiding`;
    },
    showsIn() {
      if (!this.message.delay) {
        return "";
      }

      const time = utils.useRelativeTime(
        this.message.scheduled,
        this.timestamp
      );

      if (endsWith(time, " ago")) return `Showed ${time}`;
      else if (startsWith(time, "in ")) return `Shows ${time}`;
      else return `Showing `;
    },
    safeIcon() {
      if (this.message?.icon) return this.message.icon;
      switch (this.message.type) {
        case "error":
          return "alert-circle";
        case "warning":
          return "alert-triangle";
        case "success":
          return "check-circle";
        case "info":
          return "information-circle";
        default:
          return null;
      }
    },
    safeAnchor() {
      return this.anchor || this.message?.anchor;
    },
  },
});
</script>
