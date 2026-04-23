<template></template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Badge, Button, Icon } from "@upmind-automation/upmind-ui";
import RegistrantField from "./RegistrantField.vue";

// --- config
import config from "../domain-registrant.config";

// --- types
import type { DomainRegistrantCardProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<DomainRegistrantCardProps>();

const emit = defineEmits<{
  (e: "edit", productId: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const cardStatus = computed(() =>
  props.status.isComplete ? "complete" : "incomplete"
);

const styles = useStyles(
  ["domainRegistrant.card"],
  { status: cardStatus },
  config
);
</script>
