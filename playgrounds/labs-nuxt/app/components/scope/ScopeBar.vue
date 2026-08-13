<template>
  <div
    role="group"
    :aria-label="t('labs.scope_bar')"
    :class="styles.scopeBar.root"
    data-test-key="scope-bar"
  >
    <div data-segment :class="styles.scopeBar.segment">
      <BrandSegment />
    </div>

    <Separator
      orientation="vertical"
      decorative
      :class="styles.scopeBar.separator"
    />

    <div data-segment :class="styles.scopeBar.segment">
      <SessionSwitcher />
    </div>

    <Separator
      orientation="vertical"
      decorative
      :class="styles.scopeBar.separator"
    />

    <div data-segment :class="styles.scopeBar.segment">
      <ActingForSegment />
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ScopeBar
 * @description The app chrome's ONE scope cluster — brand · identity ·
 * acting-for read as a single grouped control (`G11` · `AC1.1`). Scope is
 * global, so the cluster lives in the layout while scenarios stay on the page
 * (`G9`).
 *
 * It owns the grouping and nothing else. Each segment owns its own trigger,
 * panel, scope write and whether it renders at all — so the bar never gates
 * what a segment offers: a page's matrix greys actor rows inside the acting-for
 * picker and never reaches the global session pool (`AC1.4` · `ESC5`).
 */

import { useI18n } from "vue-i18n";
import { Separator, useStyles } from "@upmind-automation/upmind-ui";
import ActingForSegment from "./ActingForSegment.vue";
import BrandSegment from "./BrandSegment.vue";
import config from "./ScopeBar.styles";
import SessionSwitcher from "./SessionSwitcher.vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const styles = useStyles(["scopeBar"], {}, config);
</script>
