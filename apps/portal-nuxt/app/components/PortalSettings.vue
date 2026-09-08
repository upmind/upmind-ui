<script setup lang="ts">
import {
  cn,
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsDialogRoot,
  SettingsDialogContent,
  SettingsDialogGroup,
  SettingsDialogItem,
  SettingsDialogMain,
  SettingsDialogNav,
  SettingsDialogPanel,
  SettingsDialogRow,
  SettingsDialogSearch,
  SettingsDialogSection,
  SettingsDialogSidebar,
  SettingsDialogTrigger,
  navigationMenuTriggerStyle,
  sidebarNavLinkVariants,
  Switch,
  Tooltip
} from "@upmind/ui";
import { Palette, Settings } from "lucide-vue-next";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";

/**
 * Which trigger renders. `rail` is the sidebar's own; `bar` matches a chrome
 * bar's nav links, so a config can seat this beside "My Plan" and the entry
 * point is the portal's OWN Settings item rather than a second affordance
 * parked in a corner.
 */
const props = defineProps<{
  collapsed?: boolean;
  presentation?: "rail" | "bar";
  /** Resolved by the `settings` module from the shared nav vocabulary. */
  emphasisClass?: string;
}>();

const { themeName, isDark, options, setTheme, toggleMode } = useTheme();
const {
  activeConfigId,
  options: portalConfigOptions,
  setConfig,
  activeDatasetId,
  datasetOptions,
  setDataset
} = usePortalConfig();
</script>

<template>
  <SettingsDialogRoot>
    <!-- Bar: indistinguishable from the nav links either side of it, so the
         config's own "Settings" entry is what opens this. -->
    <SettingsDialogTrigger v-if="presentation === 'bar'" as-child>
      <button
        type="button"
        :class="cn(navigationMenuTriggerStyle(), props.emphasisClass)"
      >
        Settings
      </button>
    </SettingsDialogTrigger>

    <!-- Rail-collapsed: icon-only trigger with a focus-openable tooltip (matches the nav links above). -->
    <Tooltip v-else :active="collapsed" side="right" label="Settings">
      <SettingsDialogTrigger as-child>
        <button
          type="button"
          :class="
            cn(
              sidebarNavLinkVariants(),
              collapsed ? 'w-full justify-center' : 'w-full'
            )
          "
          :aria-label="collapsed ? 'Settings' : undefined"
        >
          <Settings class="size-4 shrink-0" aria-hidden="true" />
          <span v-if="!collapsed">Settings</span>
        </button>
      </SettingsDialogTrigger>
    </Tooltip>

    <SettingsDialogContent
      default-section="appearance"
      title="Settings"
      close-label="Close settings"
    >
      <SettingsDialogSidebar>
        <SettingsDialogSearch
          placeholder="Search settings"
          ariaLabel="Search settings"
        />
        <!-- One section, because one section is bound to anything. The
             Notifications / Security / Payments / Domain-defaults panels were
             decorative switches wired to nothing, and a read-back cannot tell
             those from the real ones. -->
        <SettingsDialogNav ariaLabel="Settings">
          <SettingsDialogGroup label="Sandbox">
            <SettingsDialogItem
              value="appearance"
              label="Appearance"
              :icon="Palette"
            />
          </SettingsDialogGroup>
        </SettingsDialogNav>
      </SettingsDialogSidebar>

      <SettingsDialogMain>
        <SettingsDialogPanel value="appearance">
          <SettingsDialogSection
            title="Appearance"
            description="How the portal looks — changes apply instantly across every screen."
          >
            <SettingsDialogRow
              label="Brand theme"
              description="Switch the active brand; the whole portal re-skins from tokens alone."
            >
              <template #control>
                <SelectRoot
                  :model-value="themeName"
                  @update:model-value="setTheme(String($event))"
                >
                  <SelectTrigger class="w-44" aria-label="Brand theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in options"
                      :key="option.name"
                      :value="option.name"
                    >
                      <span class="flex items-center gap-2">
                        <span
                          class="ring-stroke/50 size-3 shrink-0 rounded-full ring-1"
                          :style="{ backgroundColor: option.primary }"
                          aria-hidden="true"
                        />
                        {{ option.label }}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
              </template>
            </SettingsDialogRow>
            <SettingsDialogRow
              label="Portal shape"
              description="Switch between the shipped configurations — the chrome and content update instantly, nothing is edited."
            >
              <template #control>
                <SelectRoot
                  :model-value="activeConfigId"
                  @update:model-value="setConfig(String($event))"
                >
                  <SelectTrigger class="w-48" aria-label="Portal shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in portalConfigOptions"
                      :key="option.id"
                      :value="option.id"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
              </template>
            </SettingsDialogRow>
            <SettingsDialogRow
              label="Dataset"
              description="Which brand's data the shape renders — the full account, or the one with every brand gate switched off."
            >
              <template #control>
                <SelectRoot
                  :model-value="activeDatasetId"
                  @update:model-value="setDataset(String($event))"
                >
                  <SelectTrigger class="w-48" aria-label="Dataset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in datasetOptions"
                      :key="option.id"
                      :value="option.id"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
              </template>
            </SettingsDialogRow>
            <SettingsDialogRow
              control-id="set-dark"
              label="Dark mode"
              description="Use the dark palette across the portal."
            >
              <template #control>
                <Switch
                  id="set-dark"
                  :model-value="isDark"
                  @update:model-value="() => toggleMode()"
                />
              </template>
            </SettingsDialogRow>
          </SettingsDialogSection>
        </SettingsDialogPanel>
      </SettingsDialogMain>
    </SettingsDialogContent>
  </SettingsDialogRoot>
</template>
