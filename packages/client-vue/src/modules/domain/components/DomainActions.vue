<template>
  <Button
    v-if="meta?.available || meta?.added || selected"
    :class="styles.domain.card.footer.action"
    :disabled="meta.disabled"
    :loading="processing && selected"
    :variant="selected || meta.added ? 'flat' : 'outline'"
    :truncate="false"
    color="secondary"
    @click="selected ? onRemove(props.domain) : onUpdate(props.domain)"
    size="lg"
    :icon="selected || meta.added ? 'basket-check' : 'basket-add'"
    :label="t('domain.card.available.action', selected ? 0 : 1)"
  />

  <template v-if="!meta?.available && !selected" as="span">
    <Description class="not-italic md:max-w-64">
      {{ t("domain.card.transfer.ownership") }}
      {{ t("domain.card.transfer.transfer") }}
      <Button
        variant="link"
        class="text-emphasis-medium font-medium text-inherit underline underline-offset-1!"
        @click="onUpdate(props.domain)"
        >{{ t("domain.card.transfer.action") }}</Button
      >.
      <template v-if="meta.discounted">
        {{
          t("domain.card.transfer.renew.discounted", {
            tld: props.tld,
            regularPrice: props.price.regularPrice,
            currentPrice: props.price.currentPrice
          })
        }}
      </template>
      <template v-else>
        {{
          t("domain.card.transfer.renew.regular", {
            tld: props.tld,
            regularPrice: props.price.regularPrice,
            currentPrice: props.price.currentPrice
          })
        }}
      </template>
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
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Description from "../../../components/content/Description.vue";

// --- types
import type { DomainActionProps } from "../types";
import type { ComputedRef } from "vue";
import type CurrentPrice from "@/modules/product/components/pricing/CurrentPrice.vue";

// -----------------------------------------------------------------------------

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
