<template>
  <div class="message flex flex-col border rounded-box bg-base-100 px-4">
    <h3 class="text-inherit wrap whitespace-normal" v-if="message.title">
      {{ message.title }}
    </h3>

    <p class="whitespace-normal" v-if="message.copy">{{ message.copy }}</p>

    <p class="whitespace-normal text-xs mt-0" v-if="message.data">
      {{ message.data }}
    </p>

    <div class="flex text-xs mb-4 uppercase join font-mono">
      <!-- <span class="join-item badge  badge-ghost badge-sm">{{ message.hash }}</span> -->
      <span class="join-item badge badge-sm" :class="`badge-${message.type}`">{{
        message.type
      }}</span>
      <span class="join-item badge badge-ghost badge-sm">{{
        message.display
      }}</span>

      <span class="join-item badge badge-ghost badge-sm" v-if="meta.isActive"
        >showing</span
      >
      <span
        class="join-item badge badge-ghost badge-sm"
        v-if="message.maxAge && meta.isActive"
        >{{ hidesIn }}</span
      >
      <span
        class="join-item badge badge-ghost badge-sm"
        v-if="meta.isScheduled"
        >{{ showsIn }}</span
      >
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
import { endsWith, startsWith } from "lodash-es";

export default defineComponent({
  name: "UpmMessage",
  components: {
    UpmDebug
  },
  props: {
    item: {
      type: Object, // xstate actor
      required: true
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
