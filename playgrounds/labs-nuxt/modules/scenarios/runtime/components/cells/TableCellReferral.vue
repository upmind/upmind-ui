<template>
  <div :class="cellReferral.root()" data-test-key="cell-referral">
    <Avatar size="md" :src="image || undefined" :alt="name || undefined">
      <template #fallback>
        <span v-if="initials">{{ initials }}</span>
        <Icon v-else :icon="fallbackIcon" size="sm" aria-hidden="true" />
      </template>
    </Avatar>
    <div :class="cellReferral.body()">
      <span data-test-key="cell-referral-label">{{ maskedLabel }}</span>
      <span
        v-if="via"
        :class="cellReferral.via()"
        data-test-key="cell-referral-via"
      >
        &#8618; {{ via }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellReferral
 * @description A referral's identity, the client path of the legacy
 * `affiliateReferralsTable`: a 40px avatar, a MASKED primary line that shows the
 * entity word and bullets in place of the real name, and an optional muted
 * second line naming the link the referral came through. The real name is never
 * rendered — only the avatar's initials and `alt` read it.
 */

import { uiTypeIs } from "@jsonforms/core";
import { Avatar } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { resolveScope } from "../../scenario.utils";
import { cellReferral } from "./cells.styles";
import { get, map, random, take, toString, words } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellReferral } from "../../scenario.types";
// -----------------------------------------------------------------------------

const DEFAULT_ICON = "user-01";
const URL_STRIP = /(^https?:\/\/)?(\/$)?/g;

const props = defineProps<TableCellProps<TableCellReferral>>();

const { t } = useI18n();

// The bullet count is drawn ONCE per cell, not per render, so the mask does not
// reshuffle on every reactive read — the legacy `$_.random(6, 12)` width.
const bullets = "•".repeat(random(6, 12));

const entity = computed(() => resolveScope(props.row, props.element.scope));

const name = computed(() =>
  toString(get(entity.value, props.element.options.name) ?? "")
);

const image = computed(() =>
  toString(get(entity.value, props.element.options.image) ?? "")
);

const fallbackIcon = computed(() => props.element.options.icon ?? DEFAULT_ICON);

const initials = computed(() =>
  map(take(words(name.value), 2), word => word[0])
    .join("")
    .toUpperCase()
);

const maskedLabel = computed(
  () => `${t(props.element.options.label)} ${bullets}`
);

const via = computed(() => {
  const config = props.element.options.via;
  if (!config) return "";

  const url = toString(resolveScope(props.row, config.url) ?? "");
  if (!url) return "";

  const linkName = toString(resolveScope(props.row, config.name) ?? "");
  return t(config.i18n, {
    link: linkName ? `${linkName}: ` : "",
    url: url.replace(URL_STRIP, "")
  });
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellReferral") };
</script>
