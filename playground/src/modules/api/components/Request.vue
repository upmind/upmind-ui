<template>
  <div
    class="request collapse collapse-plus border border-base-300"
    :class="{ error: request.hasErrors, warning: request.hasNoContent }"
  >
    <input type="checkbox" name="request" />

    <div class="collapse-title">
      <h4 class="m-0">{{ request.id }}</h4>

      <em
        class="status block text-sm"
        v-if="request.isCached || request.isStale"
      >
        {{ expiresIn }}
      </em>

      <div v-for="(value, key) in request.state" :key="key" class="mt-2 -mx-1">
        <button class="btn btn-neutral btn-xs status">
          {{ key }}

          <span class="status badge badge-sm">
            {{ value }}
          </span>
        </button>
      </div>
    </div>

    <code class="collapse-content">
      <div class="mockup-code">
        <pre class="text-neutral-content" data-prefix="REQ > ">{{
          request.url
        }}</pre>
        <pre
          data-prefix="RES > "
          :class="{
            'text-success': request.response.status == 200,
            'text-error': request.response.status != 200
          }"
        ><code>{{ request.response }}</code></pre>
      </div>
    </code>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from "vue";
import { get } from "lodash-es";

function calculateRelativeTime(
  timestamp: EpochTimeStamp,
  maxAge: number,
  currentTime: EpochTimeStamp
) {
  const expiresIn = timestamp + maxAge - currentTime;
  const isExpired = expiresIn <= 0;

  const seconds = Math.floor(Math.abs(expiresIn) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;

  let formattedString = "";

  if (hours > 0) {
    formattedString += `${hours} hour${hours > 1 ? "s" : ""}`;
    if (remainingMinutes > 0 || remainingSeconds > 0) {
      formattedString += " and ";
    }
  }

  if (remainingMinutes > 0) {
    formattedString += `${remainingMinutes} minute${
      remainingMinutes > 1 ? "s" : ""
    }`;
    if (remainingSeconds > 0) {
      formattedString += " and ";
    }
  }

  if (remainingSeconds > 0) {
    formattedString += `${remainingSeconds} second${
      remainingSeconds > 1 ? "s" : ""
    }`;
  }

  return expiresIn == 0
    ? "Expires now"
    : isExpired
    ? `Expired ${formattedString} ago`
    : `Expires in ${formattedString}`;
}

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
    expiresIn() {
      if (!this.request?.completed || !this.request.maxAge) {
        return "";
      }
      // const expiresIn =
      //   this.request.completed + this.request.maxAge - this.timestamp;

      return calculateRelativeTime(
        this.request.completed,
        this.request.maxAge,
        this.timestamp
      );
    }
  }
});
</script>
