<template>
  <div
    v-if="!meta.isEmpty"
    :class="styles.domainRegistrant.checkboxes.root"
    data-testid="domain-checkboxes"
  >
    <CheckboxGroup v-model="selected" multiple>
      <CheckboxGroupItem
        v-for="product in domains"
        :key="product.id"
        :value="product.id"
        :class="styles.domainRegistrant.checkboxes.item"
      >
        <span :class="styles.domainRegistrant.checkboxes.label">
          {{
            t("domain.use_details_for", { domain: product.serviceIdentifier })
          }}
        </span>
        <Tooltip :label="t('domain.registrant_use_billing_msg')">
          <Icon
            icon="info-circle"
            size="2xs"
            :class="styles.domainRegistrant.checkboxes.tooltip"
          />
        </Tooltip>
      </CheckboxGroupItem>
    </CheckboxGroup>
  </div>
</template>

<script setup lang="ts">
// --- external
import { onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useDomainRegistrant } from "@upmind-automation/headless";
import {
  CheckboxGroup,
  CheckboxGroupItem,
  Icon,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- config
import config from "../domain-registrant.config";

// --- utils
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

/** v-model for checked domain product IDs */
const selected = defineModel<string[]>({ default: () => [] });

// -----------------------------------------------------------------------------

const { t } = useI18n();
const styles = useStyles(["domainRegistrant.checkboxes"], {}, config);
const { domains, meta, select } = useDomainRegistrant();

// --- default: all domains checked on mount
onMounted(() => {
  if (selected.value.length === 0 && domains.value.length > 0) {
    selected.value = map(domains.value, "id");
  }
});

// Sync selected to composable's model
watch(
  selected,
  ids => {
    select(ids);
  },
  { immediate: true }
);
</script>
