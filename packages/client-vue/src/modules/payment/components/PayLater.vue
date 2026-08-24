<template>
  <OptionTileGroup model-value="pay-later" mode="single">
    <OptionTile
      value="pay-later"
      :label="t('form.payment_method_type.pay-later')"
    >
      <template #trailing>
        <Link size="sm" color="muted" @click="clearGateway">
          {{ t("action.change") }}
        </Link>
      </template>
    </OptionTile>
  </OptionTileGroup>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { OptionTileGroup, OptionTile, Link } from "@upmind/ui";

// -----------------------------------------------------------------------------
const emit = defineEmits(["resolve", "reject", "cancel"]);

const { t } = useI18n();

const clearGateway = () => {
  emit("cancel");
};
</script>
