<template>
  <component
    v-if="modal || (!modal && expired)"
    :is="modal ? 'uw-dialog' : 'div'"
    size="xl"
    :model-value="expired"
    no-actions
    persistent
    skrim="light"
  >
    <slot name="content">
      <section :class="styles.session.expired.root">
        <!-- <uw-avatar :avatar="avatar" :class="styles.session.expired.avatar" /> -->

        <h3 :class="styles.session.expired.title">
          {{ title }}
        </h3>

        <p :class="styles.session.expired.text">{{ text }}</p>

        <footer>
          <uw-button
            v-if="action"
            v-bind="action"
            block
            variant="ghost"
            :href="$route.fullPath"
          />
        </footer>
      </section>
    </slot>
  </component>
</template>

<script>
// --- external
import { defineComponent, computed, watch } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);
useCustomElement(UwButton);
useCustomElement(UwDialog);

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmSessionExpired",
  components: {
    UwAvatar,
  },
  props: {
    modal: {
      type: Boolean,
      default: true,
    },
    auto: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { meta } = useSession();

    const styles = useStyles(["session.expired"], meta, config);

    if (props.auto) {
      watch(meta, () => {
        if (meta.value.hasExpired) {
          window.location.reload();
        }
      });
    }
    // ---

    return {
      meta,
      expired: computed(() => {
        const value = meta.value.hasExpired;
        return value && !props.auto;
      }),

      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      return this.$t("session.expired.title");
    },

    text() {
      return this.$t("session.expired.text");
    },

    avatar() {
      return this.$tm("session.expired.avatar");
    },
    action() {
      return this.$tm("session.expired.actions.continue");
    },
  },
});
</script>
.
