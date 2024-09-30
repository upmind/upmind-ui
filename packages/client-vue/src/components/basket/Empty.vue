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
    <section :class="styles.basket.empty.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.basket.empty.title">{{ title }}</h3>

      <p :class="styles.basket.empty.text">{{ text }}</p>

      <footer :class="styles.basket.empty.actions">
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
import { useBasket } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { Avatar, Button, Dialog } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketEmpty",
  components: {
    Avatar,
    Button,
    Dialog,
  },
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
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.empty"], meta, config);

    // ---

    return {
      meta,
      processing: ref(false),
      styles,
    };
  },
  computed: {
    isOpen() {
      const value = this.meta.isEmpty;
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
