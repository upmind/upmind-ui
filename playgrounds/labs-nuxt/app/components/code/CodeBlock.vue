<template>
  <div class="rounded-card border-stroke bg-canvas flex flex-col border">
    <div
      v-if="props.title || !props.hideCopy"
      class="border-stroke flex items-center justify-between gap-2 border-b px-3 py-2"
    >
      <span v-if="props.title" class="text-muted text-xs font-medium">
        {{ props.title }}
      </span>
      <span v-else />

      <Button
        v-if="!props.hideCopy"
        variant="ghost"
        size="sm"
        :aria-label="copyLabel"
        :data-attrs="{ 'data-test-key': 'code-copy', ...props.dataAttrs }"
        @click="copy(props.code)"
      >
        <Icon :icon="copied ? 'check' : 'copy-01'" size="xs" />
        {{ copyLabel }}
      </Button>
    </div>

    <div
      class="relative max-h-80 overflow-auto"
      :class="{ 'break-words whitespace-pre-wrap': props.wrap }"
    >
      <div v-if="isLoading" class="text-muted p-4 text-xs">
        {{ t("text.loading") }}
      </div>

      <div v-else-if="hasFailed" class="text-danger p-4 text-xs" role="alert">
        {{ t("error.something_went_wrong") }}
      </div>

      <div
        v-else
        class="code-block flex text-xs"
        :class="{ 'whitespace-pre-wrap': props.wrap }"
      >
        <div
          v-if="meta.showLineNumbers"
          aria-hidden="true"
          class="border-stroke bg-canvas text-muted sticky left-0 border-r py-4 pr-2 pl-3 text-right select-none"
        >
          <div v-for="n in lineCount" :key="n">{{ n }}</div>
        </div>

        <pre
          tabindex="0"
          class="flex-1 overflow-x-auto py-4 pr-4 pl-3"
          v-html="highlighted"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/code/CodeBlock
 * @description Shiki-highlighted source, per `docs/sdd/FE-3125/sheets-dx.md`
 * §2.1. The theme follows `useColorMode` — the user's PERSISTED choice and the
 * brand default behind it — never the bare OS preference, which would draw a
 * light code panel inside a dark app the moment the two disagree.
 */

import { Button } from "@upmind/ui";
import { useClipboard } from "@vueuse/core";
import { createHighlighter, type Highlighter } from "shiki";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, useColorMode } from "@upmind-automation/client-vue";
import { split } from "lodash-es";
import type { CodeBlockProps } from "./types";

const props = withDefaults(defineProps<CodeBlockProps>(), {
  lang: "typescript",
  lineNumbers: true,
  wrap: false,
  hideCopy: false
});

const { t } = useI18n();
const { copy, copied } = useClipboard({ legacy: true });
const { isDark } = useColorMode();

const copyLabel = computed(() =>
  copied.value ? t("confirm.copied") : t("labs.code_copy")
);

const meta = computed(() => ({
  showLineNumbers: props.lineNumbers
}));

const lineCount = computed(() => split(props.code, "\n").length);

let highlighterPromise: Promise<Highlighter> | undefined;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["vue", "typescript", "gherkin", "json"]
    });
  }
  return highlighterPromise;
}

const highlighted = ref("");
const isLoading = ref(true);
const hasFailed = ref(false);

async function highlight() {
  isLoading.value = true;
  hasFailed.value = false;
  try {
    const highlighter = await getHighlighter();
    const theme = isDark.value ? "github-dark" : "github-light";
    highlighted.value = highlighter.codeToHtml(props.code, {
      lang: props.lang ?? "typescript",
      theme
    });
  } catch {
    // The rejected promise is cached per instance, so a retry would replay the
    // same failure forever — drop it and let the next attempt build a fresh one.
    highlighterPromise = undefined;
    hasFailed.value = true;
  } finally {
    isLoading.value = false;
  }
}

watch([() => props.code, () => props.lang, isDark], highlight, {
  immediate: true
});
</script>
