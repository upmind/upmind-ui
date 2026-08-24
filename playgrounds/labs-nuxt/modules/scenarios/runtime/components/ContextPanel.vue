<template>
  <section v-if="items.length" :class="contextPanel.root()">
    <h2 :class="contextPanel.title()">{{ t("labs.debug_context") }}</h2>
    <div :class="contextPanel.list()">
      <Collapsible
        v-for="item in items"
        :key="item.key"
        :class="contextPanel.collapsible()"
      >
        <CollapsibleTrigger as-child>
          <ButtonItems
            variant="ghost"
            size="sm"
            :label="formatKey(item.key)"
            :class="contextPanel.trigger()"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre :class="contextPanel.pre()">{{ item.value }}</pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </section>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ContextPanel
 * @description Generalises the Inspector's Context section (`inspector/Inspector.vue`)
 * over a plain `snapshot.context` — every entry shown as a raw, collapsible
 * value. Purely presentational, archetype-agnostic.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@upmind/ui";
import ButtonItems from "./ButtonItems.vue";
import { contextPanel } from "./ContextPanel.styles";
import { entries, map, startCase } from "lodash-es";
import type { ContextPanelItem, ContextPanelProps } from "./ContextPanel.types";
// -----------------------------------------------------------------------------

const props = defineProps<ContextPanelProps>();

const { t } = useI18n();

function formatKey(key: string): string {
  return startCase(key);
}

const items = computed<ContextPanelItem[]>(() =>
  map(entries(props.context), ([key, value]) => ({ key, value }))
);
</script>
