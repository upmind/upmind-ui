<template>
  <aside :class="styles.clientEmpty.root">
    <h4 :class="styles.clientEmpty.title">{{ title }}</h4>
    <p :class="styles.clientEmpty.text">{{ text }}</p>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "../config.cva";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmEmailEmpty",
  props: {
    title: { type: String, default: "Cant see your phone numbers..." },
    text: { type: String, default: "Add a phone number to get started" },
  },
  setup() {
    const styles = useStyles(["clientEmpty"], {}, config);

    return {
      styles,
    };
  },
});
</script>
