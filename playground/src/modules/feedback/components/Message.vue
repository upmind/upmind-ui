<template>
  <div
    role="alert"
    class="alert flex shadow-lg border-white border-opacity-20"
    :class="[{ 'opacity-30': !meta.isActive }, `message-${message.type}`]"
    v-if="meta.isActive || (scheduled && meta.isScheduled)"
  >
    <span class="icon self-start">
      <exclamation-circle-icon
        class="h-10 w-10"
        v-if="message.type == 'error'"
      />

      <check-circle-icon class="h-10 w-10" v-if="message.type == 'success'" />

      <exclamation-triangle-icon
        class="h-8 w-8"
        v-if="message.type == 'warning'"
      />

      <information-circle-icon
        class="h-10 w-10"
        v-if="message.type == 'info'"
      />
    </span>
    <!--  -->

    <div class="flex flex-col gap-2 w-full">
      <h4 class="text-inherit wrap whitespace-normal m-0" v-if="message.title">
        {{ message.title }}
      </h4>

      <p class="whitespace-normal m-0" v-if="message.copy">
        {{ message.copy }}
      </p>

      <p class="whitespace-normal text-xs m-0" v-if="message.data">
        {{ message.data }}
      </p>
    </div>

    <div class="actions text-right self-start">
      <button
        @click.prevent="dismiss(message.hash)"
        class="btn btn-xs btn-ghost btn-circle"
        v-if="meta.isActive"
      >
        <x-mark-icon class="w-fit h-fit"></x-mark-icon>
        <span class="sr-only">Dismiss the message</span>
      </button>

      <div class="flex items-center gap-2 mb-2" v-if="debugging">
        <em
          class="text-xs ml-auto font-mono text-inherit"
          v-if="!message.maxAge && meta.isActive"
        >
          Persistent
        </em>

        <em
          class="text-xs ml-auto font-mono text-inherit"
          v-if="message.maxAge && meta.isActive"
        >
          {{ hidesIn }}
        </em>

        <em
          class="text-xs ml-auto font-mono text-inherit"
          v-if="meta.isScheduled"
        >
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "..";

import { utils } from "@upmind/flow";
import { UpmDebug } from "@upmind/components";
import {
  XMarkIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/vue/24/outline";
import { endsWith, startsWith } from "lodash-es";

export default defineComponent({
  name: "UpmMessage",
  components: {
    UpmDebug,
    XMarkIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
  },
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },
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

<style lang="scss" scoped>
.message-error {
  @apply bg-error;
  @apply text-error-content;
}

.message-success {
  @apply bg-success;
  @apply text-success-content;
}

.message-warning {
  @apply bg-warning;
  @apply text-warning-content;
}

.message-info {
  @apply bg-info;
  @apply text-info-content;
}

.message-primary {
  @apply bg-primary;
  @apply text-primary-content;
}

.message-secondary {
  @apply bg-secondary;
  @apply text-secondary-content;
}

.message-accent {
  @apply bg-accent;
  @apply text-accent-content;
}

.message-neutral {
  @apply bg-neutral;
  @apply text-neutral-content;
}
</style>
