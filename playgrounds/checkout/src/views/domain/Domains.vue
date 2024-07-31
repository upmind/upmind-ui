<template>
  <article :class="styles.domains.root">
    <section :class="styles.domains.section.root">
      <header :class="styles.domains.section.header">
        <span :class="styles.domains.section.text">
          {{ $tc("domains.header.text", selected?.length) }}
        </span>

        <h1 :class="styles.domains.section.title">
          {{ $tc("domains.header.title", selected?.length) }}
        </h1>
      </header>

      <div :class="styles.domains.section.wrapper">
        <div :class="styles.domains.section.content">
          <upm-domain sync v-model="selected" />
        </div>
      </div>

      <pre>{{ { selected } }}</pre>
      <footer :class="styles.domains.section.footer"></footer>
    </section>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { UpmDomain } from "@upmind/client-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "domains",
  i18n: { messages: getLocalMessages("domains") },
  components: { UpmDomain },
  setup() {
    const styles = useStyles(["domains", "domains.section"], null, config);
    return { styles, selected: ref() };
  },
  methods: {},
});
</script>
