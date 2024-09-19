<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'uw-drawer' : 'div'"
    :modelValue="isOpen"
    size="xl"
    persistent
    fit="cover"
    skrim="light"
  >
    <section :class="styles.domain.empty.root">
      <uw-avatar v-bind="avatar" />

      <h3 :class="styles.domain.empty.title">{{ title }}</h3>

      <p :class="styles.domain.empty.text">{{ text }}</p>

      <footer :class="styles.domain.empty.actions">
        <uw-button
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
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDrawer, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar, UwButton, UwDrawer);

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomainEmpty",
  props: {
    modal: { type: Boolean },
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
    const styles = useStyles(["domain.empty"], {}, config);

    return {
      processing: ref(false),
      styles,
    };
  },
  computed: {
    isOpen() {
      const value = true; // by default
      return value || this.modelValue;
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
});
</script>
.
