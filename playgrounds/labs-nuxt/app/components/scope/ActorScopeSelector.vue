<template>
  <div class="mx-2 flex items-center gap-2">
    <DropdownMenu
      :items="[]"
      width="full"
      popover-class="min-w-100"
      v-if="isAvailable"
    >
      <template #trigger>
        <Button
          variant="ghost"
          focus
          size="sm"
          class="cursor-pointer"
          focusable
          icon-append="chevron-down"
        >
          <Avatar v-bind="activeAvatar" size="sm" color="secondary" />
        </Button>
      </template>

      <!-- Staff sessions group -->
      <template v-if="staffSessionNodes.length">
        <DropdownMenuLabel
          class="text-muted border-b-b-neutral/10 border-b text-xs tracking-wider uppercase"
        >
          Staff
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <template v-for="staff in staffSessionNodes" :key="staff.id">
            <!-- Staff session row -->
            <DropdownMenuItem @select="switchSession(staff.actor, staff.id)">
              <div class="flex w-full items-center justify-between gap-2 p-2">
                <div class="flex items-center gap-2">
                  <Avatar
                    v-if="staff.avatar"
                    v-bind="staff.avatar"
                    size="sm"
                    color="secondary"
                    :class="staff.isActive ? ringClasses : undefined"
                  />
                  <Icon v-else :icon="staff.icon" size="sm" />
                  <span class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium">{{ staff.label }}</span>
                    <span class="text-muted text-xs">{{ staff.sublabel }}</span>
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <Badge
                    v-if="staff.expiresAt"
                    icon="clock"
                    :label="useRelativeTime(staff.expiresAt)"
                    variant="minimal"
                    :color="expiryColor(staff.expiresAt)"
                    size="sm"
                  />
                  <Button
                    size="sm"
                    color="danger"
                    variant="ghost"
                    @click.stop="logoutSession(staff.actor)"
                    title="Logout"
                    icon="log-out-01"
                  />
                </div>
              </div>
            </DropdownMenuItem>

            <!-- Impersonated clients (indented under parent staff) -->
            <template v-if="staff.impersonatedClients.length">
              <div class="border-accent-neutral/10 ml-3 border-l-2 pl-1">
                <!-- Toggle row (plain div — won't close dropdown) -->
                <div
                  class="text-muted hover:bg-accent/20 flex cursor-pointer items-center gap-1.5 rounded-xs px-2 py-1 text-xs"
                  @click.stop="toggleImpersonated(staff.id)"
                >
                  <Icon
                    icon="chevron-right"
                    size="xs"
                    class="transition-transform duration-150"
                    :class="{ 'rotate-90': isStaffExpanded(staff) }"
                  />
                  <span>Impersonating</span>
                  <Badge
                    :label="String(staff.impersonatedClients.length)"
                    variant="solid"
                    color="warning"
                    size="sm"
                    class="mr-2 ml-auto"
                  />
                </div>

                <!-- Expanded impersonated client items -->
                <template v-if="isStaffExpanded(staff)">
                  <DropdownMenuItem
                    v-for="client in staff.impersonatedClients"
                    :key="client.id"
                    class="bg-accent/20"
                    @select="switchSession(client.actor, client.id)"
                  >
                    <div class="flex w-full items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <Avatar
                          v-if="client.avatar"
                          v-bind="client.avatar"
                          size="sm"
                          color="secondary"
                          :class="client.isActive ? ringClasses : undefined"
                        />
                        <Icon v-else :icon="client.icon" size="sm" />
                        <span class="flex flex-col gap-0.5">
                          <span class="text-sm font-medium">{{
                            client.label
                          }}</span>
                          <span class="text-muted text-xs">{{
                            client.sublabel
                          }}</span>
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Badge
                          v-if="client.expiresAt"
                          icon="clock"
                          :label="useRelativeTime(client.expiresAt)"
                          variant="minimal"
                          :color="expiryColor(client.expiresAt)"
                          size="sm"
                        />
                        <Button
                          size="sm"
                          color="danger"
                          variant="ghost"
                          @click.stop="exitImpersonation"
                          title="Exit impersonation"
                          icon="log-out-01"
                        />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </template>
              </div>
            </template>
          </template>
        </DropdownMenuGroup>
      </template>

      <!-- Client sessions group (direct only, not impersonated) -->
      <template v-if="directClientItems.length">
        <DropdownMenuLabel
          class="text-muted border-b-accent-neutral/10 border-b text-xs tracking-wider uppercase"
        >
          Clients
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            v-for="client in directClientItems"
            :key="client.id"
            @select="switchSession(client.actor, client.id)"
          >
            <div class="flex w-full items-center justify-between gap-2 p-2">
              <div class="flex items-center gap-2">
                <Avatar
                  v-if="client.avatar"
                  v-bind="client.avatar"
                  size="sm"
                  color="secondary"
                  :class="client.isActive ? ringClasses : undefined"
                />
                <Icon v-else :icon="client.icon" size="sm" />
                <span class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{{ client.label }}</span>
                  <span class="text-muted text-xs">{{ client.sublabel }}</span>
                </span>
              </div>
              <div class="flex items-center gap-1">
                <Badge
                  v-if="client.expiresAt"
                  icon="clock"
                  :label="useRelativeTime(client.expiresAt)"
                  variant="minimal"
                  :color="expiryColor(client.expiresAt)"
                  size="sm"
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="ghost"
                  @click.stop="logoutSession(client.actor)"
                  title="Logout"
                  icon="log-out-01"
                />
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>

      <!-- Actions footer (inline, full-width buttons) -->
      <div
        v-if="hasActions"
        class="bg-canvas mt-2 flex items-center gap-1 rounded-b-lg px-2 py-1.5"
      >
        <Button
          v-if="canUseGuestMode"
          class="flex-1"
          variant="ghost"
          size="sm"
          icon="user-circle"
          label="Guest"
          :ring="false"
          @click="switchScope(ScopeActorTypes.GUEST)"
        />
        <Button
          v-for="scope in addableScopes"
          :key="scope"
          class="flex-1"
          variant="ghost"
          size="sm"
          :icon="scope === ScopeActorTypes.CLIENT ? 'log-in-01' : 'log-in-02'"
          :label="getScopeLabel(scope)"
          :ring="false"
          @click="addSession(scope)"
        />
      </div>
    </DropdownMenu>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, reactive } from "vue";
// --- internal
import {
  ScopeActorTypes,
  useRelativeTime,
  useSessionStore
} from "@upmind-automation/headless";
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  Icon
} from "@upmind-automation/upmind-ui";
import { useActorScopeSelector } from "./useActorScopeSelector";
import { defaultsDeep, find, some } from "lodash-es";

// ------------------------------------------------------------------------------

defineProps<{}>();

const { isAvailable } = useSessionStore().useMeta();

// --- Constants

/** Ring style applied to active session avatars (green outline). */
const ringClasses =
  "outline-success-default outline outline-3 outline-offset-2";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

// --- Composable

const {
  addableScopes,
  addSession,
  canUseGuestMode,
  directClientItems,
  exitImpersonation,
  getScopeLabel,
  logoutSession,
  sessionItems,
  staffSessionNodes,
  switchScope,
  switchSession
} = useActorScopeSelector();

// --- State

/** Tracks which staff sessions have been manually toggled open. */
const expandedStaff = reactive(new Set<string>());

/**
 * Whether a staff session's impersonated clients section is expanded.
 * Auto-expands when any impersonated client is the active session.
 */
function isStaffExpanded(staff: {
  id: string;
  impersonatedClients: { isActive: boolean }[];
}): boolean {
  return (
    expandedStaff.has(staff.id) || some(staff.impersonatedClients, "isActive")
  );
}

function toggleImpersonated(staffId: string) {
  if (expandedStaff.has(staffId)) {
    expandedStaff.delete(staffId);
  } else {
    expandedStaff.add(staffId);
  }
}

// --- Helpers

/** Returns badge color based on time remaining until expiry. */
function expiryColor(
  expiresAt: number | null
): "neutral" | "warning" | "danger" {
  if (!expiresAt) return "neutral";
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "danger";
  if (remaining < FIVE_MINUTES_MS) return "warning";
  return "neutral";
}

// --- Computed

/** Active session avatar. */
const activeAvatar = computed(() => {
  const active = find(sessionItems.value, "isActive");

  return defaultsDeep(active?.avatar, {
    icon: active?.avatar?.src ? undefined : "user-01"
  });
});

/** Whether to show the actions footer. */
const hasActions = computed(
  () => canUseGuestMode.value || addableScopes.value.length > 0
);
</script>
