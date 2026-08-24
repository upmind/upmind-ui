<template>
  <div class="feedback" :class="rootVariants()">
    <aside :class="bannersVariants()" v-auto-animate>
      <Message
        v-for="(notification, index) in notifications"
        :key="`error-notification-${index}`"
        :item="notification"
        :scheduled="scheduled"
        block
        variant="stacked"
        :dataAttrs="{ 'data-test-key': 'feedback' }"
      />
    </aside>

    <Toaster
      data-test-key="sonner-toast"
      position="bottom-right"
      close-button
      rich-colors
      :visible-toasts="6"
    />

    <Error
      v-for="error in system"
      :title="error.message.value?.title"
      :copy="error.message.value?.copy"
      :actions="error.message.value?.actions"
      :key="error.id"
      :status="error?.message.value?.data?.status"
      :open="error.meta.value.isActive"
      modal
      :storefront-route="props.storefrontRoute"
      @dismiss="error.dismiss"
    />
  </div>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { watch, ref } from "vue";
import { useMessage, useFeedback } from "@upmind-automation/headless";
import { messageTypes } from "@upmind-automation/headless";
import { Toaster, toast } from "@upmind/ui";
import Error from "../system/Error.vue";
import Message from "./components/Message.vue";
import { rootVariants, bannersVariants } from "./variants";
import { get, some, forEach } from "lodash-es";
import type { StorefrontRoute } from "../../types";

// -----------------------------------------------------------------------------
const props = defineProps<{
  scheduled?: boolean;
  storefrontRoute?: StorefrontRoute;
}>();

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
        // @ts-expect-error -- `type` is omitted from ExternalToast but the toast component does accept it
        type: getToastType(message.value.type),
        position: "top-right"
      });
      activeToasts.value.push(id);
    }
  });

  forEach(activeToasts.value, id => {
    if (!some(toasts, ["id", id])) dismissToast(id.toString());
  });
});

// vue-sonner data-type values the new Toaster styles on; neutral = no type.
function getToastType(type: messageTypes) {
  switch (type) {
    case messageTypes.DANGER:
      return "error";
    case messageTypes.INFO:
      return "info";
    case messageTypes.SUCCESS:
      return "success";
    case messageTypes.WARNING:
      return "warning";
    default:
      return undefined;
  }
}
</script>
