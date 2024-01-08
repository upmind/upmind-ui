<template>
  <div
    class="message border border-opacity-50 border-neutral-300 rounded-box mb-2 p-4"
    :class="[`bg-${message.type}`, `text-${message.type}-content`]"
  >
    <div class="title">
      <h3 class="text-inherit mt-0" v-if="message.title">
        {{ message.title }}
      </h3>
      <h4 class="text-inherit" v-if="message.subtitle">
        {{ message.subtitle }}
      </h4>
    </div>

    <p v-if="message.copy">{{ message.copy }}</p>

    <div class="flex items-center gap-2 mt-2">
      <strong
        class="status block text-xs ml-auto text-inherit"
        v-if="message.maxAge"
      >
        {{ expiresIn }}
      </strong>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, ref, onMounted } from "vue";
import type { StateMachine } from "xstate";
import { isString } from "lodash-es";
import { utils } from "@upmind/flow";

export default defineComponent({
  name: "UpmMessage",
  props: {
    machine: {
      type: Object as PropType<StateMachine<any, any, any, any>>,
      required: true
    }
  },
  setup(props) {
    const timestamp = ref(Date.now());
    const message = ref();

    props.machine.onTransition(state => {
      message.value = {
        hash: props.machine.id,
        created: state.context.created,
        type: state.context.type,
        display: state.context.display,
        dismissable: state.context.dismissable,
        title: state.context.title,
        subtitle: state.context.subtitle,
        copy: state.context.copy,
        icon: state.context.icon,
        maxAge: state.context.maxAge,
        // ---
        state: state.value,
        // ---
        isActive: state.matches("active")
      };
    });

    onMounted(() => {
      setInterval(() => {
        timestamp.value = Date.now();
      }, 500);
    });

    return {
      message,
      timestamp
    };
  },
  computed: {
    safeStates() {
      if (isString(this.message.state)) {
        return { [this.message.state]: null };
      }

      return this.message.state;
    },
    expiresIn() {
      if (!this.message?.created || !this.message.maxAge) {
        return "";
      }
      // const expiresIn =
      //   this.message.completed + this.message.maxAge - this.timestamp;

      return utils.useRelativeTime(
        this.message.created,
        this.message.maxAge,
        this.timestamp
      );
    }
  }
});
</script>
