<template>
  <div
    class="message flex flex-col rounded-box shadow-md mb-2 p-6 relative"
    :class="[
      { 'opacity-30': meta.isPending },
      // `border-${message.type}`,
      `bg-${message.type}`,
      `text-${message.type}-content`
    ]"
    v-if="meta.isActive || (pending && meta.isPending)"
  >
    <span class="whitespace-normal text-xs">{{ message.hash }}</span>

    <h3 class="text-inherit mt-0 wrap whitespace-normal" v-if="message.title">
      {{ message.title }}
    </h3>
    <h4 class="text-inherit whitespace-normal" v-if="message.subtitle">
      {{ message.subtitle }}
    </h4>

    <p class="whitespace-normal" v-if="message.copy">{{ message.copy }}</p>

    <button
      @click="dismiss(message.hash)"
      class="btn btn-xs btn-ghost btn-circle absolute top-2 right-2"
      v-if="meta.isActive"
    >
      <x-mark-icon class="w-fit h-fit"></x-mark-icon>
      <span class="sr-only">Dismiss the message</span>
    </button>

    <div class="flex items-center gap-2 mt-2">
      <em
        class="text-xs ml-auto font-mono text-inherit"
        v-if="message.maxAge && meta.isActive"
      >
        {{ hidesIn }}
      </em>

      <em class="text-xs ml-auto font-mono text-inherit" v-if="meta.isPending">
        {{ showsIn }}
      </em>
    </div>

    <upm-debug
      v-if="debugging"
      title="Message"
      :state="state.value"
      :context="message"
      :meta="meta"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "..";

import { utils } from "@upmind/flow";
import { UpmDebug } from "@upmind/components";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { endsWith, startsWith } from "lodash-es";

export default defineComponent({
  name: "UpmMessage",
  components: {
    UpmDebug,
    XMarkIcon
  },
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },
    pending: {
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

    const { state, message, meta, dismiss } = useMessage(props.item);

    onMounted(() => {
      setInterval(() => {
        timestamp.value = Date.now();
      }, 500);
    });

    return {
      state,
      message,
      meta,
      dismiss,
      timestamp
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
    }
  }
});
</script>
