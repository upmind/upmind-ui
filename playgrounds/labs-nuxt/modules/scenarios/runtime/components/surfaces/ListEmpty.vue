<template>
  <Interstitial
    v-if="isFiltered"
    :title="t('text.results_not_found')"
    :text="t('text.adjust_search_filters_msg')"
    :close-label="t('action.close')"
  >
    <template #avatar><Icon icon="search-lg" size="xl" /></template>
  </Interstitial>
  <Interstitial
    v-else
    :title="t('text.collection_empty')"
    :text="t('text.collection_empty_msg')"
    :close-label="t('action.close')"
  >
    <template #avatar><Icon icon="inbox-01" size="xl" /></template>
  </Interstitial>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListEmpty
 * @description What a list says when it holds nothing — *nothing exists* and
 * *nothing matched your filters* are different sentences, told apart by the
 * module's own `meta.isFiltered` (W-16/W-27). One component because the same
 * pair is drawn inside the table's body, inside the card grid and on its own
 * where a scenario declares no columns at all; a second copy is how the two
 * sentences drift apart.
 */

import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import type { ListEmptyProps } from "./ListSurface.types";
// -----------------------------------------------------------------------------

defineProps<ListEmptyProps>();

const { t } = useI18n();
</script>
