<template>
  <tr>
    <td>{{ request.url }}</td>
    <td>{{ request.state }}</td>
    <!-- <td>{{ request.isProcessing }}</td> -->
    <!-- <td>{{ request.isCached }}</td>
    <td>{{ request.isStale }}</td> -->
    <!-- <td>{{ request.isError }}</td> -->
  </tr>
  <!-- <code>
    <pre>
        {{ hash}}
        {{ request }}
      </pre>
  </code> -->
</template>

<script>
import { defineComponent, toRefs, computed, watch, inject, ref } from "vue";
import { useSelector, useActor } from "@xstate/vue";
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
    const upmind = inject("upmind");
    const machine = get(upmind.state.value.context.requests, props.hash);

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
