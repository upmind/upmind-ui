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
        <UpmMessage
          v-for="notification in notifications"
          :key="notification.id"
          :item="notification"
          :scheduled="scheduled"
          block
          variant="stacked"
        />
      </transition-group>
    </aside>

    <Sonner
      position="bottom-right"
      close-button
      rich-colors
      :visible-toasts="6"
    />

    <UpmTrackEvent v-for="event in events" :key="event.id" :item="event" />
  </div>
</template>

<script>
// --- external
import { defineComponent, watch, ref } from "vue";

// --- internal
import { useFeedback, useMessage } from "@upmind/headless-vue";
import { useStyles, toast } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Sonner } from "@upmind/upwind";
import UpmMessage from "./Message.vue";
import UpmTrackEvent from "./TrackEvent.vue";

// --- utils
import { forEach, some } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmFeedback",
  components: {
    Sonner,
    UpmMessage,
    UpmTrackEvent,
  },
  props: {
    scheduled: {
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

    const feedback = useFeedback();
    const activeToasts = ref([]);

    function dismissToast(id) {
      feedback.dismiss(id);
      toast.dismiss(id);
      activeToasts.value = activeToasts.value.filter(t => t !== id);
    }
    watch(feedback.toasts, toasts => {
      forEach(toasts, msg => {
        let { message, dismiss, meta } = useMessage(msg);
        if (meta.value.isActive) {
          const id = toast(message.value.title, {
            id: message.value.hash,
            description: message.value.copy,
            duration: Infinity,
            onDismiss: t => dismissToast(t.id),
            onAutoClose: t => dismissToast(t.id),
            type: message.value.type,
          });
          activeToasts.value.push(id);
        }
      });

      forEach(activeToasts.value, id => {
        if (!some(feedback.toasts.value, ["id", id])) dismissToast(id);
      });
    });

    return {
      ...feedback,
      styles,
    };
  },

  computed: {},
});
</script>
