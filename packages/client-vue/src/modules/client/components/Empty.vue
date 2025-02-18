<template>
  <aside :class="styles.clientEmpty.root">
    <h4 :class="styles.clientEmpty.title">
      {{ t(`client.${i18nKey}.empty.title`) }}
    </h4>
    <p :class="styles.clientEmpty.text">
      {{ t(`client.${i18nKey}.empty.text`) }}
    </p>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../config.cva";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "ClientEmpty",
  props: {
    i18nKey: { type: String, required: true },
  },
  setup() {
    const { t } = useI18n();
    const styles = useStyles(["clientEmpty"], {}, config);

    return {
      t,
      styles,
    };
  },
});
</script>
