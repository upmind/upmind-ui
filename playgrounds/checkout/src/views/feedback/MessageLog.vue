<template>
  <div class="message flex flex-col gap-2 rounded border border-base-200 p-4">
    <h3 class="wrap m-0 whitespace-normal text-inherit" v-if="message.title">
      {{ message.title }}
    </h3>

    <p class="m-0 whitespace-normal leading-normal" v-if="message.copy">
      {{ message.copy }}
    </p>

    <p class="m-0 whitespace-normal text-xs leading-normal" v-if="message.data">
      {{ message.data }}
    </p>

    <div class="join flex gap-2 font-mono text-xs uppercase">
      <!-- <span class="join-item badge  badge-ghost badge-sm">{{ message.hash }}</span> -->
      <span
        class="join-item badge badge-sm rounded"
        :class="`badge-${message.type}`"
        >{{ message.type }}</span
      >
      <span class="join-item badge badge-ghost badge-sm rounded">{{
        message.display
      }}</span>

      <span
        class="join-item badge badge-ghost badge-sm rounded"
        v-if="meta.isActive"
        >showing</span
      >
      <span
        class="join-item badge badge-ghost badge-sm rounded"
        v-if="message.maxAge && meta.isActive"
        >{{ hidesIn }}</span
      >
      <span
        class="join-item badge badge-ghost badge-sm rounded"
        v-if="meta.isScheduled"
        >{{ showsIn }}</span
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { useMessage, utils } from "@upmind/client-vue";
import { useTimestamp } from "@vueuse/core";

import { endsWith, startsWith } from "lodash-es";

export default defineComponent({
  name: "UpmMessage",
  components: {},
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },

    debugging: {
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
  },
});
</script>
