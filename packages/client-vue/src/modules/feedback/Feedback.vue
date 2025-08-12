<template>
  <div class="feedback" :class="styles.feedback.root">
    <aside :class="styles.feedback.banners" v-auto-animate>
      <Message
        v-for="(notification, index) in notifications"
        :key="`error-notification-${index}`"
        :item="notification"
        :scheduled="scheduled"
        block
        variant="stacked"
      />
    </aside>

    <Sonner
      position="bottom-right"
      close-button
      rich-colors
      :visible-toasts="6"
    />

    <Error
      v-for="error in system"
      :key="error.id"
      :i18nKey="error?.message.value.i18nKey"
      :status="error?.message.value?.data?.status"
      :open="error.meta.value.isActive"
      modal
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { watch, ref, type ComputedRef } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "./feedback.config";
import { useStyles, toast } from "@upmind-automation/upmind-ui";
import { useMessage, useFeedback } from "@upmind-automation/headless";

// --- components
import { Sonner } from "@upmind-automation/upmind-ui";
import Message from "./components/Message.vue";
import Error from "../system/Error.vue";

// --- utils
import { get, some, forEach } from "lodash-es";

// -----------------------------------------------------------------------------
const props = defineProps<{
  scheduled?: boolean;
}>();

const styles = useStyles(["feedback"], props, config) as ComputedRef<{
  feedback: {
    root: string;
    banners: string;
  };
}>;

const { notifications, toasts, dismiss, system } = useFeedback();
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
        duration: get(message.value, "data.persist", false) ? Infinity : 10000,
        description: message.value.copy,
        onDismiss: t => dismissToast(t.id.toString()),
        onAutoClose: t => dismissToast(t.id.toString()),
        // @ts-ignore -- we can actually pass this to the toast component
        type: message.value.type,
        position: "top-right"
      });
      activeToasts.value.push(id);
    }
  });

  forEach(activeToasts.value, id => {
    if (!some(toasts, ["id", id])) dismissToast(id.toString());
  });
});
</script>
