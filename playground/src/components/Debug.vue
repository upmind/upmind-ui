<template>
  <details
    ref="debugbar"
    v-if="isDebugging"
    class="debug"
    :open="isOpen"
    @toggle="({ target }) => (isOpen = target.open)"
  >
    <summary>
      <span>{{ isOpen ? "DEBUGGING" : "DEBUG" }}: </span>
      <strong>{{ title?.toUpperCase() }}</strong>
    </summary>

    <div>
      <details v-if="state" :open="open?.state">
        <summary>State</summary>
        <code>
          <pre> {{ state }}</pre>
        </code>
      </details>

      <details v-if="meta" :open="open?.meta">
        <summary>Meta</summary>
        <code>
          <pre> {{ meta }}</pre>
        </code>
      </details>

      <details v-if="model" :open="open?.model">
        <summary>Model</summary>
        <code>
          <pre> {{ model }}</pre>
        </code>
      </details>

      <details v-if="context" :open="open?.context">
        <summary>Context</summary>
        <code>
          <pre> {{ context }}</pre>
        </code>
      </details>

      <details v-if="errors" :open="open?.errors">
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
    context: Object,
    model: Object,
    state: [Object, String],
    open: Object,
    meta: Object,
    errors: [Object, String]
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    const isOpen = ref(props.open);
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
