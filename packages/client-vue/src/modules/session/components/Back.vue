<template>
  <Link
    class="flex items-center gap-x-2"
    @click.prevent="doReject"
    icon="arrow-left"
    :label="t('action.back_to_basket')"
    size="lg"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRoutingEngine } from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";

const { t } = useI18n();

const { navigateBack } = useRoutingEngine();

function doReject() {
  navigateBack();
}
</script>
