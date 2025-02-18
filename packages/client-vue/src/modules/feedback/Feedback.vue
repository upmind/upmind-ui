<template>
  <div class="feedback" :class="styles.feedback.root">
    <aside :class="styles.feedback.banners">
      <transition-group
        :enter-active-class="styles.feedback.transitions.banner.enter.active"
        :enter-from-class="styles.feedback.transitions.banner.enter.from"
        :enter-to-class="styles.feedback.transitions.banner.enter.to"
        :leave-active-class="styles.feedback.transitions.banner.leave.active"
        :leave-from-class="styles.feedback.transitions.banner.leave.from"
        :leave-to-class="styles.feedback.transitions.banner.leave.to"
        appear
      >
        <Message
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

    <TrackEvent v-for="event in events" :key="event.id" :item="event" />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { watch, ref, type ComputedRef } from "vue";

// --- internal
import { useFeedback, useMessage } from "@upmind-automation/headless-vue";
import { useStyles, toast } from "@upmind-automation/upmind-ui";
import config from "./feedback.config";

// --- components
import { Sonner } from "@upmind-automation/upmind-ui";
import Message from "./components/Message.vue";
import TrackEvent from "./components/TrackEvent.vue";

// --- utils
import { forEach, some } from "lodash-es";

// -----------------------------------------------------------------------------
const props = defineProps<{
  scheduled?: boolean;
}>();

const styles = useStyles(
  [
    "feedback",
    "feedback.transitions.banner.enter",
    "feedback.transitions.banner.leave",
    "feedback.transitions.toasts.enter",
    "feedback.transitions.toasts.leave",
  ],
  props,
  config
) as ComputedRef<{
  feedback: {
    root: string;
    banners: string;
    transitions: {
      banner: {
        enter: {
          active: string;
          from: string;
          to: string;
        };
        leave: {
          active: string;
          from: string;
          to: string;
        };
      };
    };
  };
}>;

const { notifications, toasts, dismiss, events } = useFeedback();
const activeToasts = ref<(string | number)[]>([]);

function dismissToast(id: string) {
  dismiss(id);
  toast.dismiss(id);
  activeToasts.value = activeToasts.value.filter(t => t !== id);
}
watch(toasts, toasts => {
  forEach(toasts, msg => {
    let { message, meta } = useMessage(msg);
    if (meta.value.isActive) {
      const id = toast(message.value.title, {
        id: message.value.hash,
        description: message.value.copy,
        duration: 10000,
        onDismiss: t => dismissToast(t.id.toString()),
        onAutoClose: t => dismissToast(t.id.toString()),
        // @ts-ignore
        type: message.value.type,
        position: "top-right",
      });
      activeToasts.value.push(id);
    }
  });

  forEach(activeToasts.value, id => {
    if (!some(toasts.value, ["id", id])) dismissToast(id.toString());
  });
});
</script>
