<template>
  <component
    :is="modal ? 'uw-dialog' : 'div'"
    size="xl"
    :model-value="true"
    no-actions
    persistent
    skrim="light"
  >
    <section slot="content" :class="styles.domain.empty.root">
      <uw-avatar :avatar="avatar" :class="styles.domain.empty.avatar" />

      <h3 :class="styles.domain.empty.title">
        {{ title }}
      </h3>

      <p :class="styles.domain.empty.text">{{ text }}</p>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwDialog, UwAvatar, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDialog);
useCustomElement(UwAvatar);

// --- utils
import { get } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomainEmpty",
  props: {
    i18nKey: { type: String, default: "domain.empty" },
    modal: { type: Boolean },
  },
  setup() {
    const styles = useStyles(["domain.empty"], {}, config);

    return {
      styles,
    };
  },
  computed: {
    translations() {
      return this.$tm(this.i18nKey);
    },
    title() {
      return get(this.translations, "title", "No domains found");
    },

    text() {
      return get(this.translations, "text", "Please try searching again");
    },

    avatar() {
      return get(this.translations, "avatar");
    },
  },
});
</script>
