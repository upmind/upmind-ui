<template>
  <Button
    v-if="meta?.available || meta?.added || selected"
    :class="styles.domain.card.footer.action"
    :disabled="meta.disabled"
    :loading="processing && selected"
    :variant="selected || meta?.added ? 'flat' : 'outline'"
    :truncate="false"
    color="secondary"
    @click="selected ? onRemove(domain) : onUpdate(domain)"
    size="md"
  >
    <span :class="styles.domain.card.footer.label">
      {{ t("domain.card.available.action", selected ? 0 : 1) }}
    </span>
    <Icon
      :class="styles.domain.card.footer.icon"
      :icon="selected || meta?.added ? 'basket-check' : 'basket-add'"
      size="xs"
    />
  </Button>

  <template v-if="!meta?.available && !selected" as="span">
    <Description class="not-italic md:max-w-64">
      {{ t("domain.card.transfer.ownership") }}
      {{ t("domain.card.transfer.transfer") }}
      <Link
        class="text-emphasis-medium font-medium text-inherit underline !underline-offset-1"
        @click="onUpdate(domain)"
        >{{ t("domain.card.transfer.action") }}</Link
      >.
      {{ t("domain.card.transfer.renew", [tld, regularPrice]) }}
    </Description>
  </template>
</template>

<script lang="ts" setup>
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../domain.config";

// components
import { Button, Icon, Link } from "@upmind-automation/upmind-ui";
import Description from "../../../components/content/Description.vue";

// --- types
import type { DomainActionProps } from "../types";
import type { ComputedRef } from "vue";

const { t } = useI18n();

const props = defineProps<DomainActionProps>();

const emit = defineEmits(["update", "remove"]);

const styles = useStyles(["domain.card.footer"], {}, config) as ComputedRef<{
  domain: {
    card: {
      footer: {
        root: string;
        action: string;
        label: string;
        icon: string;
      };
    };
  };
}>;

const onUpdate = (domain: string) => {
  emit("update", domain);
};

const onRemove = (domain: string) => {
  emit("remove", domain);
};
</script>
