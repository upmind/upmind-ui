<template>
  <div
    class="message border border-opacity-50 border-neutral-300 rounded-box mb-2 p-4"
    :class="[
      { 'opacity-30': meta.isPending },
      `bg-${message.type}`,
      `text-${message.type}-content`
    ]"
  >
    <div class="title relative pr-4">
      <h3 class="text-inherit mt-0" v-if="message.title">
        {{ message.title }}
      </h3>
      <h4 class="text-inherit" v-if="message.subtitle">
        {{ message.subtitle }}
      </h4>
      <button
        @click="dismiss(message.hash)"
        class="btn btn-xs btn-ghost btn-circle absolute top-0 right-0"
        v-if="meta.isActive && message.dismissable"
      >
        <x-mark-icon class="w-fit h-fit"></x-mark-icon>
        <span class="sr-only">Dismiss the message</span>
      </button>
    </div>

    <p v-if="message.copy">{{ message.copy }}</p>

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
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, ref, onMounted, computed } from "vue";
import type { StateMachine } from "xstate";
import { utils } from "@upmind/flow";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { endsWith, startsWith } from "lodash-es";

export default defineComponent({
  name: "UpmMessage",
  components: {
    XMarkIcon
  },
  props: {
    machine: {
      type: Object as PropType<StateMachine<any, any, any, any>>,
      required: true
    }
  },
  setup(props) {
    const timestamp = ref(Date.now());
    const state = ref();

    props.machine.onTransition(newState => (state.value = newState));

    const message = computed(() => state.value.context);

    const meta = computed(() => ({
      isActive: state.value.matches("active"),
      isPending: state.value.matches("pending")
    }));

    onMounted(() => {
      setInterval(() => {
        timestamp.value = Date.now();
      }, 500);
    });

    return {
      message,
      meta,
      timestamp,
      dismiss: id => props.machine.send({ type: "DISMISS", data: { id } })
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
