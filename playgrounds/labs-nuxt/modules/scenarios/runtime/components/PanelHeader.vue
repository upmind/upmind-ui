<template>
  <header
    data-test-key="panel-header"
    class="flex flex-wrap items-center gap-3"
  >
    <Heading :level="2" class="mr-auto text-base font-semibold">
      {{ name }}
    </Heading>

    <Tooltip
      v-for="action in actions"
      :key="action.name"
      :label="locked ? t('labs.replay_locked') : (action.disabledReason ?? '')"
      :active="!!locked || !!action.disabledReason"
    >
      <Button
        :variant="action.variant ?? 'primary'"
        size="sm"
        :disabled="action.disabled || locked"
        :loading="action.loading"
        :data-attrs="{ 'data-test-value': kebabCase(action.label) }"
        @click="action.onSelect"
      >
        <Icon
          v-if="action.icon"
          :icon="action.icon"
          size="nano"
          aria-hidden="true"
        />
        {{ action.label }}
        <span v-if="action.loading" role="status" class="sr-only">{{
          t("text.loading")
        }}</span>
      </Button>
    </Tooltip>
  </header>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PanelHeader
 * @description The heading of one panel of an area — the panel's own label and
 * its collection's header controls. The sibling of `PageHeader`, which names a
 * whole page by its route in the page's one h1: a panel sits under that page,
 * so it is an h2 set in the ordinary face, and its controls are the same
 * pre-bound `ActionSlotItem`s the surface hands up.
 */

import { Button, Heading, Tooltip } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { kebabCase } from "lodash-es";
import type { PanelHeaderProps } from "./PanelHeader.types";

// -----------------------------------------------------------------------------

defineProps<PanelHeaderProps>();

const { t } = useI18n();
</script>
