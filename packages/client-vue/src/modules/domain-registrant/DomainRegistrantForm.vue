<template></template>

<script setup lang="ts">
// --- external
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useDomainRegistrant,
  useRoutingEngine
} from "@upmind-automation/headless";

// --- components
import { Button, Input, useStyles } from "@upmind-automation/upmind-ui";
import DomainCheckboxes from "./components/DomainCheckboxes.vue";

// --- styles
import config from "./domain-registrant.config";

// --- utils
import { every, isEmpty, map } from "lodash-es";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const styles = useStyles(["domainRegistrant.form"], {}, config);
const { navigateNext } = useRoutingEngine();
const { applyProvision, domains, meta, model, select } = useDomainRegistrant();
</script>
