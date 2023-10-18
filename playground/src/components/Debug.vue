<template>
  <details
    ref="debugbar"
    v-if="isDebugging"
    class="debug"
    @toggle="({ target }) => (isOpen = target.open)"
  >
    <summary>
      <span>{{ isOpen ? "DEBUGGING" : "DEBUG" }}: </span>
      <strong>{{ title?.toUpperCase() }}</strong>
    </summary>

    <div>
      <details v-if="state">
        <summary>State</summary>
        <code>
          <pre> {{ state }}</pre>
        </code>
      </details>

      <details v-if="meta">
        <summary>Meta</summary>
        <code>
          <pre> {{ meta }}</pre>
        </code>
      </details>

      <details v-if="values">
        <summary>Values</summary>
        <code>
          <pre> {{ values }}</pre>
        </code>
      </details>

      <details v-if="errors">
        <summary>Errors</summary>
        <code>
          <pre> {{ errors }}</pre>
        </code>
      </details>
    </div>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  name: "Debug",
  components: {},
  inheritAttrs: true,
  customOptions: {},
  props: {
    disable: { type: Boolean, default: false },
    title: String,
    values: Object,
    state: [Object, String],
    meta: Object,
    errors: [Object, String]
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    const isOpen = ref(false);
    const debugbar = ref();

    return {
      isOpen,
      debugbar
    };
  },
  computed: {
    isDebugging(): boolean {
      return !this.disable && import.meta.env.DEV;
    }
  }
});
</script>

<style scoped lang="scss">
details {
  margin-top: 1em;
}
</style>
