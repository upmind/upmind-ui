<template>
  <component
    :is="modal ? 'upw-dialog' : 'div'"
    size="xl"
    :model-value="open"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.basket.empty.root">
      <uw-avatar :avatar="avatar" :class="styles.basket.empty.avatar" />

      <h3 :class="styles.basket.empty.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.empty.text">{{ text }}</p>

      <footer>
        <upw-button
          v-if="action"
          v-bind="action"
          block
          variant="ghost"
          :href="storefrontUrl"
        />
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwDialog, UwAvatar, UpwButton } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketEmpty",
  components: {
    UpwDialog,
    UwAvatar,
    UpwButton,
  },
  props: {
    modal: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.empty"], meta, config);

    // ---

    return {
      meta,
      open: computed(() => {
        const value = meta.value.isEmpty;
        return value;
      }),

      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      return this.$t("basket.empty.title");
    },

    text() {
      return this.$t("basket.empty.text");
    },

    avatar() {
      return this.$tm("basket.empty.avatar");
    },
    action() {
      return this.$tm("basket.empty.actions.continue");
    },
    storefrontUrl() {
      return import.meta.env.VITE_APP_STOREFRONT;
    },
  },
});
</script>
.
