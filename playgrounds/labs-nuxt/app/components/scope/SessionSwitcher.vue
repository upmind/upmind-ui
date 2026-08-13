<template>
  <DropdownMenu
    v-if="isAvailable"
    :items="[]"
    width="2xl"
    :ui-config="{ dropdownMenu: { group: ['p-0'] } }"
  >
    <template #trigger>
      <Button
        variant="ghost"
        size="sm"
        icon-append="chevron-down"
        :aria-label="t('labs.session_pool')"
        :class="styles.sessionSwitcher.trigger"
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
            variant="muted"
            color="warning"
            :label="t('labs.session_impersonating')"
            :class="styles.sessionSwitcher.impersonationCue"
            :data-attrs="{ 'data-test-key': 'session-impersonation-cue' }"
          />
        </Tooltip>
      </Button>
    </template>

    <template v-for="group in groups" :key="group.label">
      <DropdownMenuLabel :class="styles.sessionSwitcher.groupLabel">
        {{ t(group.label) }}
      </DropdownMenuLabel>

      <DropdownMenuGroup :class="styles.sessionSwitcher.group">
        <template v-for="node in group.nodes" :key="node.id">
          <DropdownMenuItem
            :class="sessionItem({ isActive: node.isActive })"
            :aria-current="node.isActive ? 'true' : undefined"
            @select="switchSession(node.actor, node.id)"
          >
            <span :class="styles.sessionSwitcher.identity">
              <Avatar
                size="sm"
                color="secondary"
                :src="node.avatar?.src"
                :caption="node.avatar?.caption"
              />
              <span :class="styles.sessionSwitcher.labels">
                <span :class="styles.sessionSwitcher.label">
                  {{ node.label }}
                </span>
                <span
                  v-if="node.sublabel"
                  :class="styles.sessionSwitcher.sublabel"
                >
                  {{ t(node.sublabel) }}
                </span>
              </span>
            </span>

            <span :class="styles.sessionSwitcher.trailing">
              <Icon
                v-if="node.isActive"
                icon="check"
                size="nano"
                :class="styles.sessionSwitcher.activeMark"
              />
              <Badge
                v-if="node.expiresAt"
                icon="clock"
                size="sm"
                variant="muted"
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

          <!-- The impersonation nest. Its trigger is deliberately NOT a menu
               item: opening and closing a staff session's clients is not a
               choice of session, so the pool stays open through it. -->
          <Collapsible
            v-if="nestOf(node).length"
            :open="isExpanded(node)"
            :class="styles.sessionSwitcher.nest"
            @update:open="open => expanded.set(node.id, open)"
          >
            <CollapsibleTrigger
              :class="styles.sessionSwitcher.nestTrigger"
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
                variant="muted"
                color="warning"
                :label="String(nestOf(node).length)"
                :class="styles.sessionSwitcher.nestCount"
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
                <span :class="styles.sessionSwitcher.identity">
                  <Avatar
                    size="sm"
                    color="secondary"
                    :src="client.avatar?.src"
                    :caption="client.avatar?.caption"
                  />
                  <span :class="styles.sessionSwitcher.labels">
                    <span :class="styles.sessionSwitcher.label">
                      {{ client.label }}
                    </span>
                    <span
                      v-if="client.sublabel"
                      :class="styles.sessionSwitcher.sublabel"
                    >
                      {{ t(client.sublabel) }}
                    </span>
                  </span>
                </span>

                <span :class="styles.sessionSwitcher.trailing">
                  <Icon
                    v-if="client.isActive"
                    icon="check"
                    size="nano"
                    :class="styles.sessionSwitcher.activeMark"
                  />
                  <Badge
                    v-if="client.expiresAt"
                    icon="clock"
                    size="sm"
                    variant="muted"
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
      :class="styles.sessionSwitcher.actions"
      data-test-key="actor-scope-add-account"
    >
      <template v-if="addableScopes.length">
        <DropdownMenuLabel :class="styles.sessionSwitcher.actionsLabel">
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
  Icon,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";
import config, { nestChevron, sessionItem } from "./SessionSwitcher.styles";
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

const styles = useStyles(["sessionSwitcher"], {}, config);
</script>
