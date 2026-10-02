<template>
  <Alert
    v-if="notice"
    :variant="notice.variant ?? 'info'"
    appearance="outline"
    :title="t(notice.i18n.title, params)"
    :description="notice.i18n.text ? t(notice.i18n.text, params) : undefined"
    :action="
      control ? { label: control.label, dataAttrs: controlAttrs } : undefined
    "
    :data-attrs="{
      'data-test-key': `record-alert-${section.key}`,
      'data-test-value': notice.name
    }"
    @click="onAction"
  >
    <template v-if="notice.icon" #icon>
      <Icon :icon="notice.icon" aria-hidden="true" />
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordAlertSection
 * @description The `alert` section kind — the first declared notice whose
 * gates open, drawn as one alert carrying its bound call to action.
 */

import { Alert } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { noticeValues, openNotice } from "./record.utils";
import { first, kebabCase } from "lodash-es";
import type { RecordSectionProps } from "./record.types";
import type { RecordAlertSection } from "../../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<RecordSectionProps<RecordAlertSection>>();

const { t } = useI18n();

const notice = computed(() =>
  openNotice(props.section.alerts, gate => props.allows?.(gate) ?? !gate)
);

const params = computed(() =>
  notice.value ? noticeValues(notice.value, props.model) : {}
);

const control = computed(() =>
  notice.value?.action ? first(props.bind([notice.value.action])) : undefined
);

const controlAttrs = computed(() => ({
  "data-test-value": kebabCase(control.value?.label)
}));

function onAction(): void {
  if (control.value && !control.value.disabled) control.value.onSelect();
}
</script>
