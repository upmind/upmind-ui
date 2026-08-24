<template>
  <DropdownMenu v-if="isAvailable" :items="[]" class="w-80">
    <template #trigger>
      <Button
        variant="ghost"
        size="sm"
        icon-append="chevron-down"
        :aria-label="t('labs.session_pool')"
        class="cursor-pointer"
        :data-attrs="{ 'data-test-key': 'session-switcher' }"
      >
        <Avatar
          size="sm"
          color="secondary"
          :src="activeSession?.avatar?.src"
          :caption="activeSession?.avatar?.caption"
          :icon="activeSession ? undefined : getScopeIcon(actorScope)"
        />

        <Tooltip
          v-if="isImpersonated"
          :label="
            t('labs.session_impersonating_as', { label: activeSession?.label })
          "
        >
          <Badge
            icon="eye"
            size="sm"
            appearance="muted"
            color="warning"
            :label="t('labs.session_impersonating')"
            class="ml-1"
            :data-attrs="{ 'data-test-key': 'session-impersonation-cue' }"
          />
        </Tooltip>
      </Button>
    </template>

    <template v-for="group in groups" :key="group.label">
      <DropdownMenuLabel
        class="text-muted border-surface border-b text-xs tracking-wider uppercase"
      >
        {{ t(group.label) }}
      </DropdownMenuLabel>

      <DropdownMenuGroup class="flex flex-col p-1">
        <template v-for="node in group.nodes" :key="node.id">
          <DropdownMenuItem
            :class="sessionItem({ isActive: node.isActive })"
            :aria-current="node.isActive ? 'true' : undefined"
            @select="switchSession(node.actor, node.id)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Avatar
                size="sm"
                color="secondary"
                :src="node.avatar?.src"
                :caption="node.avatar?.caption"
              />
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-sm font-medium">
                  {{ node.label }}
                </span>
                <span v-if="node.sublabel" class="text-muted truncate text-xs">
                  {{ t(node.sublabel) }}
                </span>
              </span>
            </span>

            <span class="ml-auto flex shrink-0 items-center gap-1">
              <Icon
                v-if="node.isActive"
                icon="check"
                size="nano"
                class="text-accent-success"
              />
              <Badge
                v-if="node.expiresAt"
                icon="clock"
                size="sm"
                appearance="muted"
                :color="expiryColor(node.expiresAt)"
                :label="useRelativeTime(node.expiresAt)"
              />
              <Tooltip :label="t('action.logout')">
                <Button
                  size="sm"
                  color="danger"
                  variant="ghost"
                  icon="log-out-01"
                  icon-only
                  :label="t('action.logout')"
                  :aria-label="t('action.logout')"
                  @click.stop="logoutSession(node.actor, node.id)"
                />
              </Tooltip>
            </span>
          </DropdownMenuItem>

          <Collapsible
            v-if="nestOf(node).length"
            :open="isExpanded(node)"
            class="border-surface ml-4 border-l pl-1"
            @update:open="open => expanded.set(node.id, open)"
          >
            <CollapsibleTrigger
              class="text-muted hover:bg-button-ghost-hover flex w-full cursor-pointer items-center gap-1.5 rounded-xs px-2 py-1 text-xs"
              @click.stop
            >
              <Icon
                icon="chevron-right"
                size="nano"
                :class="nestChevron({ isOpen: isExpanded(node) })"
              />
              <span>{{ t("labs.session_impersonating") }}</span>
              <Badge
                size="sm"
                appearance="muted"
                color="warning"
                :label="String(nestOf(node).length)"
                class="mr-2 ml-auto"
              />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <DropdownMenuItem
                v-for="client in nestOf(node)"
                :key="client.id"
                :class="sessionItem({ isActive: client.isActive })"
                :aria-current="client.isActive ? 'true' : undefined"
                @select="switchSession(client.actor, client.id)"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <Avatar
                    size="sm"
                    color="secondary"
                    :src="client.avatar?.src"
                    :caption="client.avatar?.caption"
                  />
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate text-sm font-medium">
                      {{ client.label }}
                    </span>
                    <span
                      v-if="client.sublabel"
                      class="text-muted truncate text-xs"
                    >
                      {{ t(client.sublabel) }}
                    </span>
                  </span>
                </span>

                <span class="ml-auto flex shrink-0 items-center gap-1">
                  <Icon
                    v-if="client.isActive"
                    icon="check"
                    size="nano"
                    class="text-accent-success"
                  />
                  <Badge
                    v-if="client.expiresAt"
                    icon="clock"
                    size="sm"
                    appearance="muted"
                    :color="expiryColor(client.expiresAt)"
                    :label="useRelativeTime(client.expiresAt)"
                  />
                  <Tooltip :label="t('labs.session_exit_impersonation')">
                    <Button
                      size="sm"
                      color="danger"
                      variant="ghost"
                      icon="log-out-01"
                      icon-only
                      :label="t('labs.session_exit_impersonation')"
                      :aria-label="t('labs.session_exit_impersonation')"
                      @click.stop="logoutSession(client.actor, client.id)"
                    />
                  </Tooltip>
                </span>
              </DropdownMenuItem>
            </CollapsibleContent>
          </Collapsible>
        </template>
      </DropdownMenuGroup>
    </template>

    <div
      v-if="hasActions"
      class="bg-canvas border-surface flex flex-col gap-1 border-t p-2"
      data-test-key="actor-scope-add-account"
    >
      <template v-if="addableScopes.length">
        <DropdownMenuLabel class="text-muted text-xs tracking-wider uppercase">
          {{ t("labs.session_add_account") }}
        </DropdownMenuLabel>
        <Button
          v-for="scope in addableScopes"
          :key="scope"
          variant="ghost"
          size="sm"
          align="left"
          block
          :ring="false"
          :icon="scope === ScopeActorTypes.CLIENT ? 'log-in-01' : 'log-in-02'"
          :label="t(getAddSessionLabel(scope))"
          :data-attrs="{ 'data-test-key': getAddSessionTestKey(scope) }"
          @click="addSession(scope)"
        />
      </template>

      <Button
        v-if="canUseGuestMode"
        variant="ghost"
        size="sm"
        align="left"
        block
        icon="user-circle"
        :ring="false"
        :label="t('labs.session_guest')"
        :data-attrs="{ 'data-test-key': 'actor-scope-add-guest' }"
        @click="switchScope(ScopeActorTypes.GUEST)"
      />
    </div>
  </DropdownMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/SessionSwitcher
 * @description The session pool — every session the app holds, in one menu:
 * staff with their impersonated clients nested beneath them, direct clients in
 * their own group, and the ways to add another at the foot (`AC1.2`/`AC1.3`).
 *
 * New looks over the SAME mechanism `ActorScopeSelector.vue` drove, never a
 * parallel one — every capability that component had is preserved cell for cell
 * in `parity.yaml` (`F5 CORRECTED`/`H9`), which is the acceptance standard: UX
 * and looks were free to change, functionality was not.
 *
 * The pool is GLOBAL chrome (`G9`), so no page's scope matrix ever gates it:
 * switching to an actor this page cannot serve stays available, and the greying
 * lives in the acting-for picker instead (`ESC5`, `parity.yaml` A1).
 *
 * The trigger also carries the always-visible impersonation cue the deleted
 * `ImpersonationBar` held (`F5 CORRECTED` — no functionality lost): while the
 * active session has a parent it says so beside the avatar and names who in a
 * tooltip — inside the identity control itself, never a bar of its own.
 *
 * Nothing renders at all while the session store is unavailable — an empty menu
 * would offer a pool that does not exist.
 */

import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import {
  ScopeActorTypes,
  useRelativeTime,
  useSessionStore
} from "@upmind-automation/headless";
import {
  Avatar,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  Tooltip
} from "@upmind/ui";
import { Icon } from "@upmind-automation/client-vue";
import { nestChevron, sessionItem } from "./SessionSwitcher.styles";
import { useActorScopeSelector } from "./useActorScopeSelector";
import { find, isEmpty, reject, some } from "lodash-es";
import type { SessionItem, StaffSessionNode } from "./useActorScopeSelector";
// -----------------------------------------------------------------------------

/** A session as the pool draws it: staff carry a nest, direct clients do not. */
type PoolNode = SessionItem | StaffSessionNode;

type PoolGroup = { label: string; nodes: PoolNode[] };

/** The existing component's own warning threshold — parity, not a new choice. */
const FIVE_MINUTES_MS = 5 * 60 * 1000;

const { t } = useI18n();

const store = useSessionStore();
const { isAvailable } = store.useMeta();
const { impersonatedSession } = store.useContext();

const {
  actorScope,
  addableScopes,
  addSession,
  canUseGuestMode,
  directClientItems,
  getAddSessionLabel,
  getAddSessionTestKey,
  getScopeIcon,
  logoutSession,
  sessionItems,
  staffSessionNodes,
  switchScope,
  switchSession
} = useActorScopeSelector();

/** Nests the user has opened or closed by hand; the rest answer to what is active. */
const expanded = reactive(new Map<string, boolean>());

const groups = computed<PoolGroup[]>(() =>
  reject(
    [
      { label: "labs.session_staff", nodes: staffSessionNodes.value },
      { label: "labs.session_clients", nodes: directClientItems.value }
    ],
    group => isEmpty(group.nodes)
  )
);

const activeSession = computed(() => find(sessionItems.value, "isActive"));

/** The active session has a parent, so the app is acting as someone else. */
const isImpersonated = computed(() => !!impersonatedSession.value);

const hasActions = computed(
  () => canUseGuestMode.value || !isEmpty(addableScopes.value)
);

function nestOf(node: PoolNode): SessionItem[] {
  return "impersonatedClients" in node ? node.impersonatedClients : [];
}

/** A nest opens itself for the session being acted as, until the user says otherwise. */
function isExpanded(node: PoolNode): boolean {
  return expanded.get(node.id) ?? some(nestOf(node), "isActive");
}

function expiryColor(
  expiresAt: number | null
): "neutral" | "warning" | "danger" {
  if (!expiresAt) return "neutral";
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "danger";
  if (remaining < FIVE_MINUTES_MS) return "warning";
  return "neutral";
}
</script>
