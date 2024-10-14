<template>
  <aside :class="styles.clientEmpty.root">
    <h4 :class="styles.clientEmpty.title">
      {{ $t(`client.${i18nKey}.empty.title`) }}
    </h4>
    <p :class="styles.clientEmpty.text">
      {{ $t(`client.${i18nKey}.empty.text`) }}
    </p>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientEmpty",
  props: {
    i18nKey: { type: String, required: true },
  },
  setup() {
    const styles = useStyles(["clientEmpty"], {}, config);

    return {
      styles,
    };
  },
});
</script>
