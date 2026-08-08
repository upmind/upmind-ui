<template>
  <Alert
    :color="content.color"
    :icon="content.icon"
    :title="content.title"
    :description="content.description"
    :class="styles.moduleStateNotice.root"
  >
    <pre v-if="formattedDetail" :class="styles.moduleStateNotice.detail">{{
      formattedDetail
    }}</pre>
  </Alert>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/ModuleStateNotice
 * @description The shared loading/error notice every archetype surface
 * renders in place of its normal content (design.md FE-2977 §Block C).
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Alert, useStyles } from "@upmind-automation/upmind-ui";
import config from "./ModuleStateNotice.styles";
import { isNil } from "lodash-es";
import type {
  ModuleStateContent,
  ModuleStateContentMap,
  ModuleStateNoticeProps
} from "./ModuleStateNotice.types";
// -----------------------------------------------------------------------------

const props = defineProps<ModuleStateNoticeProps>();

const { t } = useI18n();

const content = computed<ModuleStateContent>(() => {
  const catalogue: ModuleStateContentMap = {
    loading: {
      color: "info",
      icon: "clock",
      title: t("text.loading"),
      description: t("text.moment_short_desc")
    },
    error: {
      color: "danger",
      icon: "alert-triangle",
      title: t("error.something_went_wrong"),
      description: t("error.something_went_wrong_text")
    }
  };

  return catalogue[props.state];
});

const formattedDetail = computed(() =>
  isNil(props.detail) ? "" : JSON.stringify(props.detail, null, 2)
);

const meta = computed(() => ({ state: props.state }));
const styles = useStyles(["moduleStateNotice"], meta, config);
</script>
