<template>
  <div class="request">
    <h4 class="url">{{ request.url }}</h4>
    <code class="status">{{ request.state }}</code>

    <!-- <td>{{ request.isProcessing }}</td> -->
    <!-- <td>{{ request.isCached }}</td>
    <td>{{ request.isStale }}</td> -->
    <!-- <td>{{ request.isError }}</td> -->
  </div>

  <!-- <code>
    <pre>
        {{ hash}}
        {{ request }}
      </pre>
  </code> -->
</template>

<script lang="ts">
import { defineComponent, inject, ref } from "vue";
import { get } from "lodash-es";

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

    const request = ref();

    machine.onTransition(state => {
      request.value = {
        url: state.context.url,
        state: state.value,
        // response: state.context.response,
        // status: state.context.response?.status,
        // data: state.context.response?.data,
        isProcessing: state.matches("processing"),
        isCached: state.matches("processed.cached"),
        isStale: state.matches("processed.stale"),
        isError: state.matches("error")
      };
    });

    return {
      request
    };
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
  }
}
</style>
