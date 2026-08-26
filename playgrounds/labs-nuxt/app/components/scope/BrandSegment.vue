<template>
  <!-- Single brand: static display, no dropdown -->
  <div
    v-if="isSingleBrand"
    class="text-muted flex items-center gap-1 px-2 py-1 text-sm"
    :data-attrs="{ 'data-test-key': 'brand-segment' }"
  >
    <Icon v-if="active?.icon" :icon="active.icon" size="xs" />
    {{ active?.label }}
  </div>

  <!-- Multiple brands: dropdown selector -->
  <DropdownMenu
    v-else
    align="start"
    :items="items"
    :label="t('labs.brand_menu')"
    class="border-promo shadow-overlay rounded-xl"
  >
    <template #trigger>
      <Button
        size="sm"
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'brand-segment' }"
      >
        <Icon v-if="active?.icon" :icon="active.icon" size="xs" />
        {{ active?.label }}
        <Icon icon="chevron-down" size="xs" />
      </Button>
    </template>

    <template #item="{ item }">
      <div class="flex w-full items-center gap-2">
        <span
          v-if="item.color"
          class="size-3 shrink-0 rounded-full"
          :style="{ backgroundColor: item.color }"
        />
        <span class="truncate">{{ item.label }}</span>
      </div>
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
 * (`AC1.5`, `D9`).
 *
 * It DOES declare one colour, and only one: `R10`'s brand swatch, which is a
 * brand's own configured hex and therefore cannot be a token. That single
 * inline style is the app's only one, and the value is validated to a hex
 * before it reaches the CSSOM (`swatch`).
 */

import { Button, DropdownMenu } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@upmind-automation/client-vue";
import { useBrand, useActiveSession } from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  buildScopePath,
  useBrandScope,
  useScopeConfig
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { filter, find, forEach, map, some } from "lodash-es";
import type { MenuItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { preserveQuery } = usePlaygroundUrlState();
const brandScope = useBrandScope();
const scope = useScopeConfig();
const {
  brandId: hostBrandId,
  name: hostBrandName,
  styles: hostBrandStyles
} = useBrand();

// Staff session brands (FE-2973)
const activeSession = useActiveSession();
const { actor: sessionActor, activeUser: sessionUser } =
  activeSession.useContext();
const isStaffSession = computed(
  () => sessionActor.value === AccessRoleTypes.STAFF
);
const staffBrands = computed(() =>
  isStaffSession.value ? sessionUser.value?.brands : undefined
);

const activeBrand = computed(() =>
  brandScope.value.mode === "brand" ? brandScope.value.brandId : "org"
);

interface BrandChoice {
  value: string;
  label: string;
  icon: string;
  color?: string;
}

/**
 * A brand's own hex, or nothing. `brand_color` is API-configured data reaching
 * the ONE inline style this app declares (`R10`'s swatch), so only the shape a
 * brand token actually takes is let through — anything else paints no swatch
 * rather than being handed to the CSSOM to interpret.
 */
const BRAND_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function swatch(color?: string): string | undefined {
  return color && BRAND_COLOR.test(color) ? color : undefined;
}

const choices = computed<BrandChoice[]>(() => {
  const brands: BrandChoice[] = [];

  if (hostBrandId.value)
    brands.push({
      value: hostBrandId.value,
      label: hostBrandName.value || hostBrandId.value,
      icon: "building-02",
      color: swatch(hostBrandStyles.value?.brand_color)
    });

  // Staff session brands (FE-2973): add all brands the staff user can access
  const sessionBrands = staffBrands.value;
  if (sessionBrands) {
    forEach(sessionBrands, brand => {
      if (!some(brands, ["value", brand.id])) {
        brands.push({
          value: brand.id,
          label: brand.name || brand.id,
          icon: "building-02",
          color: swatch(brand.style?.brand_color)
        });
      }
    });
  }

  // A pasted link can name a brand this host does not resolve. It is the scope
  // the page IS at, so it is offered rather than left unrepresented — a menu
  // that cannot show the active brand has nothing to mark.
  if (
    activeBrand.value !== "org" &&
    !some(brands, ["value", activeBrand.value])
  )
    brands.push({
      value: activeBrand.value,
      label: activeBrand.value,
      icon: "building-02"
    });

  // Only show "Organisation-wide" if multiple brands exist
  if (brands.length > 1) {
    return [
      { value: "org", label: t("labs.brand_org"), icon: "globe-01" },
      ...brands
    ];
  }

  return brands;
});

const isSingleBrand = computed(() => choices.value.length === 1);

const active = computed(() => {
  const match = find(choices.value, ["value", activeBrand.value]);
  // If "org" but only 1 brand exists, show that brand
  if (!match && isSingleBrand.value) return choices.value[0];
  return match;
});

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

interface BrandMenuItem extends MenuItem {
  color?: string;
}

const items = computed<BrandMenuItem[]>(() =>
  map(choices.value, choice => ({
    label: choice.label,
    value: choice.value,
    color: choice.color,
    onSelect: () => select(choice.value),
    dataAttrs: {
      "data-test-key": "brand-segment-item",
      "data-test-value": choice.value
    }
  }))
);
</script>
