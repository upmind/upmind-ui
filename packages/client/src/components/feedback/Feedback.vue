<template>
  <div class="feedback" :class="styles.feedback.root">
    <aside :class="styles.feedback.banners">
      <transition-group
        :enter-active-class="styles.bannerTransitionEnter.active"
        :enter-from-class="styles.bannerTransitionEnter.from"
        :enter-to-class="styles.bannerTransitionEnter.to"
        :leave-active-class="styles.bannerTransitionLeave.active"
        :leave-from-class="styles.bannerTransitionLeave.from"
        :leave-to-class="styles.bannerTransitionLeave.to"
        appear
      >
        <upm-message
          v-for="notification in notifications"
          :key="notification.id"
          :item="notification"
          :scheduled="scheduled"
          block
          variant="stacked"
        />
      </transition-group>
    </aside>

    <aside class="toasts" :class="styles.feedback.toasts">
      <transition-group
        :enter-active-class="styles.toastTransitionEnter.active"
        :enter-from-class="styles.toastTransitionEnter.from"
        :enter-to-class="styles.toastTransitionEnter.to"
        :leave-active-class="styles.toastTransitionLeave.active"
        :leave-from-class="styles.toastTransitionLeave.from"
        :leave-to-class="styles.toastTransitionLeave.to"
        appear
      >
        <upm-message
          v-for="toast in toasts"
          :key="toast.id"
          :item="toast"
          :scheduled="scheduled"
          variant="stacked"
          anchor="bottom"
        ></upm-message>
      </transition-group>
    </aside>
  </div>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useFeedback } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";
import UpmMessage from "./Message.vue";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmFeedback",
  components: {
    UpmMessage,
  },
  props: {
    scheduled: {
      type: Boolean,
      default: false,
    },
    debugging: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const styles = useStyles(
      [
        "feedback",
        "bannerTransitionEnter",
        "bannerTransitionLeave",
        "toastTransitionEnter",
        "toastTransitionLeave",
      ],
      props,
      config
    );

    return {
      ...useFeedback(),
      styles,
    };
  },

  computed: {},
});
</script>
