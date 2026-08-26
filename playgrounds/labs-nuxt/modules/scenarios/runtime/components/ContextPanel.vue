<template>
  <section v-if="items.length" :class="contextPanel.root()">
    <Heading :level="2" class="text-sm">{{ t("labs.debug_context") }}</Heading>
    <!-- The library's defaults are FAQ-scale (py-4, medium text). A debug list
         of keys reads at code scale: tight rows, mono labels. -->
    <Accordion
      type="multiple"
      :items="sections"
      :class="contextPanel.list()"
      :ui="{
        trigger: 'py-2 font-mono text-xs font-normal text-body',
        content: 'pb-3'
      }"
    >
      <template #content="{ item }">
        <CodeBlock
          :code="item.body"
          lang="json"
          :line-numbers="false"
          hide-copy
        />
      </template>
    </Accordion>
  </section>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ContextPanel
 * @description Generalises the Inspector's Context section (`inspector/Inspector.vue`)
 * over a plain `snapshot.context` — every entry shown as a raw, collapsible
 * value. Purely presentational, archetype-agnostic.
 *
 * The dump is READ-ONLY: `hide-copy` because what a caller hands in is
 * arbitrary machine context, and a one-press clipboard export of an unknown
 * payload is a credential exfiltration channel the panel cannot vet. Callers
 * still redact at the source — this only removes the export button.
 */

import { Accordion, Heading } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { contextPanel } from "./ContextPanel.styles";
import { entries, isObject, map, startCase } from "lodash-es";
import type { ContextPanelItem, ContextPanelProps } from "./ContextPanel.types";
import { CodeBlock } from "~/components/code";
// -----------------------------------------------------------------------------

const props = defineProps<ContextPanelProps>();

const { t } = useI18n();

function formatKey(key: string): string {
  return startCase(key);
}

function formatValue(value: unknown): string {
  if (isObject(value)) return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

const items = computed<ContextPanelItem[]>(() =>
  map(entries(props.context), ([key, value]) => ({ key, value }))
);

const sections = computed(() =>
  map(items.value, item => ({
    value: item.key,
    title: formatKey(item.key),
    body: formatValue(item.value),
    dataAttrs: { "data-test-value": item.key }
  }))
);
</script>
