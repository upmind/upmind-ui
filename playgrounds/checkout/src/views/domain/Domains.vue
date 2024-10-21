<template>
  <article :class="styles.domains.root">
    <section :class="styles.domains.section.root">
      <header :class="styles.domains.section.header">
        <span :class="styles.domains.section.text">
          {{ t("domains.header.text", isEmpty(selected) ? 0 : 1) }}
        </span>

        <h1 :class="styles.domains.section.title">
          {{ t("domains.header.title", isEmpty(selected) ? 0 : 1) }}
        </h1>
      </header>

      <div :class="styles.domains.section.wrapper">
        <div :class="styles.domains.section.content">
          <UpmDomain sync v-model="selected" />
        </div>
      </div>

      <footer :class="styles.domains.section.footer"></footer>
    </section>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { UpmDomain } from "@upmind/client-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils
import { isEmpty } from "lodash-es";

const { t } = useI18n();
const selected = ref<string[]>([]);
const styles = useStyles(["domains", "domains.section"], null, config);
</script>
