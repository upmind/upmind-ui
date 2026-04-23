<template>
  <div
    v-if="items.length"
    :class="styles.domainRegistrant.checkboxes.root"
    data-testid="domain-checkboxes"
  >
    <CheckboxGroup v-model="selected" multiple>
      <CheckboxGroupItem
        v-for="product in items"
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
import { computed, onMounted, watch } from "vue";
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

// --- types
import type { DomainRegistrantContext } from "@upmind-automation/headless";

// --- config
import config from "../domain-registrant.config";

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    /** Hide domains that already have valid provision fields */
    hideValid?: boolean;
  }>(),
  { hideValid: false }
);

/** v-model for checked domain product IDs */
const selected = defineModel<DomainRegistrantContext["model"]>({
  default: () => []
});

// -----------------------------------------------------------------------------

const { t } = useI18n();
const styles = useStyles(["domainRegistrant.checkboxes"], {}, config);
const { domains, invalidDomains, meta, model, select } = useDomainRegistrant();

/** Filtered domains based on hideValid prop */
const items = computed(() =>
  props.hideValid ? invalidDomains.value : domains.value
);

// --- default: all domains checked on mount
onMounted(() => {
  selected.value = model.value ?? selected.value;
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
