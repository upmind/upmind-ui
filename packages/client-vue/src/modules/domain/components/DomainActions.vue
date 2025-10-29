<template>
  <Button
    v-if="meta?.available || meta?.added || selected"
    :class="styles.domain.card.footer.action"
    :disabled="meta.disabled"
    :loading="processing && selected"
    :variant="selected || meta.added ? 'subtle' : 'outline'"
    :truncate="false"
    color="secondary"
    @click="selected ? onRemove(props.domain) : onUpdate(props.domain)"
    size="lg"
    icon="shopping-bag-02"
    :label="t('action.register_or_added', selected || meta.added ? 0 : 1)"
  />
  <template v-if="!meta?.available && !selected && !meta.added" as="span">
    <p class="text-muted y-0 text-sm not-italic md:max-w-76">
      {{ t("domain.own_domain_qn") }}
      {{ t("domain.transfer_domain_by_msg") }}
      <Link
        class="text-muted font-medium text-inherit underline underline-offset-1!"
        @click="onUpdate(props.domain)"
        size="inherit"
        >{{ t("action.clicking_here") }}</Link
      >.
      <template v-if="meta.discounted">
        {{
          t("domain.tld_renewal_price_desc", {
            tld: props.tld,
            regularPrice: props.price.regularPrice,
            currentPrice: props.price.currentPrice
          })
        }}
      </template>
      <template v-else>
        {{
          t("domain.tld_renewal_price_from_desc", {
            tld: props.tld,
            regularPrice: props.price.regularPrice,
            currentPrice: props.price.currentPrice
          })
        }}
      </template>
    </p>
  </template>
</template>

<script lang="ts" setup>
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../domain.config";

// components
import { Button, Link } from "@upmind-automation/upmind-ui";

// --- types
import type { DomainActionProps } from "../types";
import type { ComputedRef } from "vue";

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
