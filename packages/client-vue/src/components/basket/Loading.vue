<template>
  <component
    :is="modal ? 'upw-dialog' : 'div'"
    size="xl"
    :model-value="open"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.basket.loading.root">
      <upw-avatar
        :avatar="avatar"
        :class="styles.basket.loading.avatar"
        loading
      />

      <h1 :class="styles.basket.loading.title">
        {{ title }}
      </h1>

      <p :class="styles.basket.loading.text">{{ text }}</p>
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
import { UpwAvatar } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketloading",
  components: {
    UpwAvatar,
  },
  props: {
    modal: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.loading"], meta, config);

    // ---

    return {
      meta,
      open: computed(() => {
        const value = meta.value.isProcessingOrder || meta.value.isComplete;
        return value;
      }),

      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      return this.$t("basket.loading.title");
    },

    text() {
      return this.$t("basket.loading.text");
    },

    avatar() {
      return this.$tm("basket.loading.avatar");
    },
    action() {
      return this.$tm("basket.loading.actions.continue");
    },
  },
});
</script>
.
