<template>
  <div class="relative z-[99] bg-transparent">
    <aside class="grid grid-cols-1 gap-4">
      <upm-message
        v-for="notification in notifications"
        :key="notification.id"
        :item="notification"
        :scheduled="scheduled"
      />
    </aside>

    <aside
      class="toast toast-top toast-end grid grid-cols-1 gap-4 max-h-screen overflow-auto z-[999]"
    >
      <upm-message
        v-for="toast in toasts"
        :key="toast.id"
        :item="toast"
        class="max-w-sm"
        :scheduled="scheduled"
      ></upm-message>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useFeedback } from "..";
import UpmMessage from "../components/Message.vue";

export default defineComponent({
  name: "UpmFeedback",
  components: {
    UpmMessage
  },
  props: {
    scheduled: {
      type: Boolean,
      default: false
    },
    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const timestamp = ref(Date.now());

    const { state, messages, toasts, notifications, meta, useTime, add } =
      useFeedback();

    onMounted(() => {
      setInterval(() => {
        timestamp.value = Date.now();
      }, 500);
    });

    return {
      state,
      messages,
      toasts,
      notifications,
      meta,
      useTime,
      add,
      timestamp
    };
  },

  computed: {}
});
</script>
