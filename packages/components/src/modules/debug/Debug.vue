<template>
  <div
    refcollapse="debugbar"
    v-if="isDebugging"
    data-theme="dark"
    class="prose max-w-none collapse collapse-arrow debug prose-sm border bg-base-100 mt-4"
    @toggle="({ target }) => (isOpen = target.open)"
  >
    <input type="checkbox" name="debug" :checked="isOpen" />
    <span class="collapse-title uppercase m-0">
      <span>{{ isOpen ? "DEBUGGING" : "DEBUG" }}: </span>
      <strong>{{ title?.toUpperCase() }}</strong>
    </span>

    <div class="collapse-content">
      <div class="join join-vertical w-full">
        <div
          class="collapse collapse-plus join-item border border-base-200"
          v-if="state"
        >
          <input type="checkbox" name="debug-state" :checked="open?.state" />

          <strong class="collapse-title uppercase">State</strong>
          <code class="collapse-content">
            <pre class="my-0"> {{ state }}</pre>
          </code>
        </div>

        <div
          class="collapse collapse-plus join-item border border-base-200"
          v-if="meta"
        >
          <input type="checkbox" name="debug-meta" :checked="open?.meta" />

          <strong class="collapse-title uppercase">Meta</strong>
          <code class="collapse-content">
            <pre class="my-0"> {{ meta }}</pre>
          </code>
        </div>

        <div
          class="collapse collapse-plus join-item border border-base-200"
          v-if="model"
        >
          <input type="checkbox" name="debug-model" :checked="open?.model" />

          <strong class="collapse-title uppercase">Model</strong>
          <code class="collapse-content">
            <pre class="my-0"> {{ model }}</pre>
          </code>
        </div>

        <div
          class="collapse collapse-plus join-item border border-base-200"
          v-if="context"
        >
          <input
            type="checkbox"
            name="debug-context"
            :checked="open?.context"
          />

          <strong class="collapse-title uppercase">Context</strong>
          <code class="collapse-content">
            <pre class="my-0"> {{ context }}</pre>
          </code>
        </div>

        <div class="collapse collapse-plus" v-if="errors">
          <input type="checkbox" name="debug-errors" :checked="open?.errors" />

          <strong class="collapse-title uppercase">Errors</strong>
          <code class="collapse-content">
            <pre class="my-0"> {{ errors }}</pre>
          </code>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "UpmDebug",
  components: {},
  inheritAttrs: true,
  customOptions: {},
  props: {
    debugging: { type: Boolean, default: true },
    title: String,
    context: [Object, String, Array],
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
      return this.debugging && import.meta.env.DEV;
    }
  }
});
</script>
