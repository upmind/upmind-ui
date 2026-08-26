<template>
  <section v-if="items.length" :class="metaPanel.root()">
    <Heading :level="2" class="text-sm">{{ t("labs.debug_meta") }}</Heading>

    <div :class="metaPanel.list()">
      <!-- ON reads as a filled chip with a tick, OFF as a hollow one: the flags
           a dev scans for are the ones that are true. -->
      <Badge
        v-for="item in items"
        :key="item.key"
        size="sm"
        :variant="item.value ? 'primary' : 'neutral'"
        :appearance="item.value ? 'muted' : 'outline'"
        data-test-key="badge"
        :data-test-value="item.value ? 'on' : 'off'"
      >
        <Icon v-if="item.value" icon="check" size="nano" aria-hidden="true" />
        {{ startCase(item.key) }}
      </Badge>
    </div>
  </section>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/runtime/components/MetaPanel
 * @description A module's meta flags, ON first, as a scannable chip row.
 */

import { Badge, Heading } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { metaPanel } from "./MetaPanel.styles";
import { entries, map, sortBy, startCase } from "lodash-es";
import type { MetaPanelItem, MetaPanelProps } from "./MetaPanel.types";

const props = defineProps<MetaPanelProps>();

const { t } = useI18n();

const items = computed<MetaPanelItem[]>(() =>
  sortBy(
    map(entries(props.meta), ([key, value]) => ({ key, value })),
    [item => (item.value ? 0 : 1), "key"]
  )
);
</script>
