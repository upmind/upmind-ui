<template>
  <Alert
    :color="content.color"
    :icon="content.icon"
    :title="content.title"
    :description="content.description"
    :class="styles.moduleStateNotice.root"
  >
    <p v-if="reason" :class="styles.moduleStateNotice.detail">{{ reason }}</p>
  </Alert>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleStateNotice
 * @description The shared loading/error notice every archetype surface
 * renders in place of its normal content.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Alert, useStyles } from "@upmind-automation/upmind-ui";
import { ModuleState } from "./module-state.types";
import config from "./ModuleStateNotice.styles";
import { get, isNil, isString } from "lodash-es";
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
    [ModuleState.UNSERVED]: {
      color: "warning",
      icon: "log-in-01",
      title: t("labs.scope_unavailable"),
      description: t("labs.scope_unavailable_text")
    },
    [ModuleState.LOADING]: {
      color: "info",
      icon: "clock",
      title: t("text.loading"),
      description: t("text.moment_short_desc")
    },
    [ModuleState.ERROR]: {
      color: "danger",
      icon: "alert-triangle",
      title: t("error.something_went_wrong"),
      description: t("error.something_went_wrong_text")
    }
  };

  return catalogue[props.state];
});

/**
 * The SENTENCE that says why, never the envelope it arrived in (`S14`): a
 * serialised `{ code, data, origin, status }` blob is not something a user can
 * read, and the raw artefact already has a home — the Debug sheet. A detail
 * arrives either as the API's own error, whose `message` IS that sentence, or
 * as this app's own i18n key for a refusal it raised itself; `t` carries both,
 * since it hands an already-written sentence straight back.
 */
const reason = computed(() => {
  if (isNil(props.detail)) return "";
  const message = get(props.detail, "message", props.detail);
  return isString(message) ? t(message) : "";
});

const meta = computed(() => ({ state: props.state }));
const styles = useStyles(["moduleStateNotice"], meta, config);
</script>
