<template>
  <div class="request">
    <h4 class="url">{{ request.url }}</h4>
    <code class="status">{{ request.state }}</code>
    <small class="status" v-if="request.isCached || request.isStale">{{
      expiresIn
    }}</small>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, computed, onMounted } from "vue";
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
        url: state.context.url,
        state: state.value,
        maxAge: state.context.maxAge,
        created: state.context.created,
        completed: state.context.completed,
        // ---
        // response: state.context.response,
        // status: state.context.response?.status,
        // data: state.context.response?.data,
        // ---
        isProcessing: state.matches("processing"),
        isCached: state.matches("processed.cached"),
        isStale: state.matches("processed.stale"),
        isError: state.matches("error")
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

<style scoped lang="scss">
.request {
  margin-top: 1em;
  &:not(:last-child) {
    border-bottom: 1px solid whitesmoke;
    padding-bottom: 1em;
  }
  .url {
    word-break: break-all;
  }
  .status {
    color: gray;
    display: block;
  }
}
</style>
