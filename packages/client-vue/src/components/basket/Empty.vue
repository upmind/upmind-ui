<template>
  <upw-dialog size="xl" :model-value="open" no-actions persistent skrim="light">
    <section :class="styles.basket.empty.root">
      <upw-avatar :avatar="avatar" :class="styles.basket.empty.avatar" />

      <h3 :class="styles.basket.empty.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.empty.text">{{ text }}</p>

      <footer>
        <upw-button
          :label="$t('basket.empty.actions.continue')"
          block
          prepend-icon="arrow-left"
          to="/"
          variant="ghost"
        />
      </footer>
    </section>
  </upw-dialog>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwDialog, UpwAvatar, UpwButton } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketEmpty",
  components: {
    UpwDialog,
    UpwAvatar,
    UpwButton,
  },
  props: {},
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.empty"], meta, config);

    // ---

    return {
      meta,
      open: computed(() => {
        const value = !meta.value.isAvailable;
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
      return this.$t("basket.empty.avatar");
    },
  },
});
</script>
.
