<template>
  <header data-test-key="page-header" :class="styles.pageHeader.root">
    <h1 :class="styles.pageHeader.title">{{ name }}</h1>

    <!-- The tooltip's own trigger is the wrapper, so the reason is still
         reachable over a control the pointer can no longer press (`R6-23`). -->
    <Tooltip
      v-for="action in actions"
      :key="action.name"
      :label="t('labs.replay_locked')"
      :active="!!locked"
    >
      <Button
        :color="action.color ?? 'primary'"
        :variant="action.variant ?? 'solid'"
        :icon="action.icon"
        :label="action.label"
        :disabled="action.disabled || locked"
        :loading="action.loading"
        @click="action.onSelect"
      />
    </Tooltip>
  </header>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PageHeader
 * @description The page's own header — its identity and the actions that act
 * on the collection as a whole, drawn above the surface that lists it.
 *
 * The title is the COMPOSABLE's name (D1). A scenario declares no label on
 * purpose: the directory, the url segment, the route name, the menu item and
 * this title are all one string, so a prettified alias could never leave the
 * page disagreeing with the path it is on.
 *
 * It renders the collection's actions, it does not own them: the list surface
 * still owns the handoff each one opens and hands them in already bound, so
 * "Add new" leaves the display cluster without leaving the declaration that
 * placed it (G4). Here it is the PAGE's own primary action rather than one of
 * several beside a row, so it carries its label and the solid primary
 * treatment — the declaration overriding either. Nothing that only changes how
 * the rows are DISPLAYED belongs here: the ordering and view controls sit with
 * the data they change (G3).
 *
 * While a scenario drives the page the control is LOCKED rather than withdrawn
 * (`R6-23`): a replay is a playback, so Add new would fight the script — and a
 * control that vanished on arm would move the header's own row.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Button, Tooltip, useStyles } from "@upmind-automation/upmind-ui";
import config from "./PageHeader.styles";
import { isEmpty } from "lodash-es";
import type { PageHeaderProps } from "./PageHeader.types";
// -----------------------------------------------------------------------------

const props = defineProps<PageHeaderProps>();

const { t } = useI18n();

const meta = computed(() => ({ hasActions: !isEmpty(props.actions) }));
const styles = useStyles(["pageHeader"], meta, config);
</script>
