<template>
  <DropdownMenu
    align="start"
    size="sm"
    :items="items"
    :title="t('labs.brand_menu')"
  >
    <template #trigger>
      <Button
        size="sm"
        variant="ghost"
        icon-append="chevron-down"
        :icon="active?.icon"
        :label="active?.label"
        :data-attrs="{ 'data-test-key': 'brand-segment' }"
      />
    </template>
  </DropdownMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/BrandSegment
 * @description The scope bar's brand segment — a menu of the brands the app
 * knows with the active one marked (`F6`, `AC1.1`). It replaces
 * `BrandScopeSelector.vue`, whose whole affordance was a brand-id text field: a
 * pasted id is not a designed open state.
 *
 * What the app knows is what the real mechanism holds (`S10`): organisation-wide
 * (the bare route, `E15`), the brand `useBrand` resolves for this host, and the
 * brand a pasted link names. Headless carries no brand-list capability, so
 * offering more would mean inventing one (the `ESC4` shape).
 *
 * Choosing writes the brand path segment: a scope navigation, so it goes through
 * the router and carries the surface query with it (`preserveQuery`, design
 * §7.3). Stacking is the dropdown's own portal — this file declares no z-index
 * and no colour (`AC1.5`, `D9`).
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useBrand } from "@upmind-automation/headless";
import { Button, DropdownMenu } from "@upmind-automation/upmind-ui";
import {
  buildScopePath,
  useBrandScope,
  useScopeConfig
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { filter, find, map, some } from "lodash-es";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { preserveQuery } = usePlaygroundUrlState();
const brandScope = useBrandScope();
const scope = useScopeConfig();
const { brandId: hostBrandId, name: hostBrandName } = useBrand();

const activeBrand = computed(() =>
  brandScope.value.mode === "brand" ? brandScope.value.brandId : "org"
);

const choices = computed(() => {
  const known = [
    { value: "org", label: t("labs.brand_org"), icon: "globe-01" }
  ];

  if (hostBrandId.value)
    known.push({
      value: hostBrandId.value,
      label: hostBrandName.value || hostBrandId.value,
      icon: "building-02"
    });

  // A pasted link can name a brand this host does not resolve. It is the scope
  // the page IS at, so it is offered rather than left unrepresented — a menu
  // that cannot show the active brand has nothing to mark.
  if (!some(known, ["value", activeBrand.value]))
    known.push({
      value: activeBrand.value,
      label: activeBrand.value,
      icon: "building-02"
    });

  return known;
});

const active = computed(() =>
  find(choices.value, ["value", activeBrand.value])
);

const page = computed(() => {
  const segments = filter(route.path.split("/"), Boolean);
  return (route.params.brandIdOrOrg ? segments[1] : segments[0]) ?? "";
});

async function select(value: string): Promise<void> {
  if (value === activeBrand.value) return;

  const { actor, context } = scope.value;

  await router.push(
    preserveQuery(
      buildScopePath({
        page: page.value,
        brandId: value === "org" ? undefined : value,
        actor,
        context
      })
    )
  );
}

const items = computed<DropdownMenuItemProps[]>(() =>
  map(choices.value, choice => ({
    label: choice.label,
    value: choice.value,
    icon: choice.value === activeBrand.value ? "check" : choice.icon,
    handler: () => select(choice.value),
    dataAttrs: {
      "data-test-key": "brand-segment-item",
      "data-test-value": choice.value
    }
  }))
);
</script>
