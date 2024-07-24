<template>
  <div :class="styles.lineclamp.root">
    <div
      ref="wrapper"
      :class="mergeStyles(`line-clamp-${lines}`, styles.lineclamp.wrapper)"
    >
      <slot />
    </div>

    <transition name="fade">
      <p v-if="truncated" :class="styles.lineclamp.actions">
        <upw-button
          variant="link"
          size="xs"
          @click="open = !open"
          :label="meta.isOpen ? labelLess : labelMore"
          :append-icon="meta.isOpen ? iconLess : iconMore"
        />
      </p>
    </transition>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, computed } from "vue";

// --- internal
import UpwButton from "../button/Button.vue";
import config from "./config.cva";

// --- utils
import { mergeStyles, useStyles } from "../../utils";

// ---------------------------------------------------------------------------
export default defineComponent({
  name: "UpwLineclamp",
  components: { UpwButton },
  props: {
    labelMore: { type: String, default: "Show more" },
    labelLess: { type: String, default: "Show less" },
    iconMore: { type: String, default: "arrow-down" },
    iconLess: { type: String, default: "arrow-up" },
    lines: { type: Number, default: 3 },
    forceOpen: { type: Boolean, default: false },
  },
  setup(props) {
    const open = ref(props.forceOpen);
    const truncated = ref(false);

    const meta = computed(() => ({
      lines: props.lines,
      isOpen: open.value,
      isTruncated: truncated.value,
    }));

    const styles = useStyles("lineclamp", meta, config);

    return {
      styles,
      mergeStyles,
      meta,
      truncated,
      open,
      wrapper: ref(),
    };
  },

  computed: {
    windowWidth(): number {
      return window.innerWidth;
    },
  },
  watch: {
    windowWidth: { handler: "setDefaultClampState" },
  },
  mounted() {
    setTimeout(this.setDefaultClampState, 200);
  },
  methods: {
    setDefaultClampState() {
      this.$nextTick(() => {
        this.truncated =
          (this.wrapper as Element)?.scrollHeight >
          (this.wrapper as Element)?.clientHeight;
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.upw-lineclamp {
  ::v-deep pre {
    white-space: pre-wrap !important;
  }
}
</style>
