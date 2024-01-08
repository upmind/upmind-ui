<template>
  <div
    class="request collapse collapse-plus border border-opacity-50 border-neutral-300 rounded-box mb-2"
    :class="{ error: request.hasErrors, warning: request.hasNoContent }"
  >
    <input type="checkbox" name="request" />

    <div class="collapse-title">
      <h4 class="m-0 text-inherit">{{ request.id }}</h4>

      <div class="flex items-center gap-2 mt-2">
        <button
          class="btn btn-neutral btn-outline btn-xs status"
          v-for="(value, key) in safeStates"
          :key="key"
        >
          {{ key }}

          <span class="status badge badge-neutral badge-sm" v-if="value">
            {{ value }}
          </span>
        </button>
        <code
          class="status block text-xs ml-auto font-thin"
          v-if="request.isCached || request.isStale"
        >
          {{ expiresIn }}
        </code>
      </div>
    </div>

    <code class="mockup-code collapse-content min-w-full rounded-none">
      <pre data-prefix="REQ > ">
          <div>{{ request.url }}</div>
        </pre>
      <pre
        v-if="request?.response"
        data-prefix="RES > "
        :class="{
          'text-success': request.response.status == 200,
          'text-error': request.response.status != 200
        }"
      >
       <div>{{ request.response }}</div>
        </pre>
    </code>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from "vue";
import { get, isString } from "lodash-es";
import { utils } from "@upmind/flow";

export default defineComponent({
  name: "UpmRequest",
  props: {
    hash: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const { requests } = inject("upmind");
    const machine = get(requests.value, props.hash);
    const timestamp = ref(Date.now());
    const request = ref();

    machine.onTransition(state => {
      request.value = {
        id: machine.id,
        url: state.context.url,
        state: state.value,
        maxAge: state.context.maxAge,
        created: state.context.created,
        completed: state.context.completed,
        // ---
        response: state.context.response,
        // status: state.context.response?.status,
        // data: state.context.response?.data,
        // ---
        isProcessing: state.matches("processing"),
        isCached: state.matches("processed.cached"),
        isStale: state.matches("processed.stale"),
        hasNoContent: state.matches("processed.empty"),
        hasErrors: state.matches("error")
      };
    });

    onMounted(() => {
      setInterval(() => {
        timestamp.value = Date.now();
      }, 500);
    });

    return {
      request,
      timestamp
    };
  },
  computed: {
    safeStates() {
      if (isString(this.request.state)) {
        return { [this.request.state]: null };
      }

      return this.request.state;
    },
    expiresIn() {
      if (!this.request?.completed || !this.request.maxAge) {
        return "";
      }
      // const expiresIn =
      //   this.request.completed + this.request.maxAge - this.timestamp;

      return utils.useRelativeTime(
        this.request.completed,
        this.request.maxAge,
        this.timestamp
      );
    }
  }
});
</script>
