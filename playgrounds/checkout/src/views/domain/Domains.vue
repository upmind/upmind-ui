<template>
  <article :class="styles.domains.root">
    <section :class="styles.domains.section.root">
      <header :class="styles.domains.section.header">
        <span :class="styles.domains.section.text">
          {{ $tc("domains.header.text", isEmpty(selected) ? 0 : 1) }}
        </span>

        <h1 :class="styles.domains.section.title">
          {{ $tc("domains.header.title", isEmpty(selected) ? 0 : 1) }}
        </h1>
      </header>

      <div :class="styles.domains.section.wrapper">
        <div :class="styles.domains.section.content">
          <upm-domain sync v-model="selected" />
        </div>
      </div>

      <!-- <pre>{{ { selected } }}</pre> -->

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
import { isEmpty } from "lodash-es";

export default defineComponent({
  name: "domains",
  i18n: { messages: getLocalMessages("domains") },
  components: { UpmDomain },
  setup() {
    const styles = useStyles(["domains", "domains.section"], null, config);
    return { styles, selected: ref(), isEmpty };
  },
  methods: {},
});
</script>
