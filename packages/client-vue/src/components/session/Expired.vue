<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Dialog' : 'div'"
    :modelValue="isOpen"
    size="xl"
    persistent
    fit="cover"
    skrim="light"
  >
    <section :class="styles.session.expired.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.session.expired.title">{{ title }}</h3>

      <p :class="styles.session.expired.text">{{ text }}</p>

      <footer>
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useSession } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { Avatar, Button, Dialog } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmSessionExpired",
  components: {
    Avatar,
    Button,
    Dialog,
  },
  props: {
    modal: { type: Boolean },
    auto: { type: Boolean },
    title: { type: String },
    text: { type: String },
    action: { type: Object, default: () => null },
    modelValue: { type: Boolean, default: true },
    avatar: {
      type: Object,
      default: () => ({
        size: "lg",
        shape: "circle",
        color: "primary",
        icon: "basket",
        fit: "contain",
      }),
    },
  },
  setup(props) {
    const { meta } = useSession();

    const styles = useStyles(["session.expired"], meta, config);

    // ---

    return {
      meta,
      processing: ref(false),
      styles,
    };
  },
  computed: {
    isOpen() {
      const value = this.meta.hasExpired;
      return (value || this.modelValue) && !this.auto;
    },
    hasAction() {
      return !isEmpty(this.action);
    },
  },
  methods: {
    doAction() {
      if (isFunction(this.action?.handler)) {
        this.processing = true;
        this.action.handler().finally(() => {
          this.processing = false;
        });
      }
    },
  },
  watch: {
    meta({ hasExpired }) {
      if (this.auto && hasExpired) window.location.reload();
    },
  },
});
</script>
.
