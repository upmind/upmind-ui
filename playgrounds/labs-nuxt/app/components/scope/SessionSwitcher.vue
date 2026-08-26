<template>
  <DropdownMenu v-if="isAvailable" :items="[]" class="w-80">
    <template #trigger>
      <Button
        variant="ghost"
        size="sm"
        :aria-label="t('labs.session_pool')"
        class="cursor-pointer"
        :data-attrs="{ 'data-test-key': 'session-switcher' }"
      >
        <Avatar
          size="sm"
          :src="activeSession?.avatar?.src"
          :alt="activeSession?.avatar?.caption"
          :force-caption="activeSession?.avatar?.forceCaption"
        >
          <template #fallback>
            <Icon
              v-if="!activeSession"
              :icon="getScopeIcon(actorScope)"
              size="xs"
            />
            <template v-else>{{ activeSession?.avatar?.caption }}</template>
          </template>
        </Avatar>

        <Tooltip
          v-if="isImpersonated"
          :label="
            t('labs.session_impersonating_as', { label: activeSession?.label })
          "
        >
          <Badge
            size="sm"
            appearance="muted"
            variant="warning"
            class="ml-1"
            data-test-key="session-impersonation-cue"
          >
            <Icon icon="eye" size="xs" />
            {{ t("labs.session_impersonating") }}
          </Badge>
        </Tooltip>

        <Icon icon="chevron-down" size="xs" />
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
                :src="node.avatar?.src"
                :alt="node.avatar?.caption"
                :force-caption="node.avatar?.forceCaption"
              >
                <template #fallback>{{ node.avatar?.caption }}</template>
              </Avatar>
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
                class="text-success"
              />
              <Badge
                v-if="node.expiresAt"
                size="sm"
                appearance="muted"
                :variant="expiryColor(node.expiresAt)"
                data-test-key="session-expiry"
              >
                <Icon icon="clock" size="xs" />
                {{ useRelativeTime(node.expiresAt) }}
              </Badge>
              <Tooltip :label="t('action.logout')">
                <Button
                  size="sm"
                  variant="ghost"
                  icon-only
                  class="text-danger"
                  :aria-label="t('action.logout')"
                  @click.stop="logoutSession(node.actor, node.id)"
                >
                  <Icon icon="log-out-01" size="xs" />
                </Button>
              </Tooltip>
            </span>
          </DropdownMenuItem>

          <Collapsible
            v-if="nestOf(node).length"
            :open="isExpanded(node)"
            class="border-surface ml-4 border-l pl-1"
            @update:open="open => expanded.set(node.id, open)"
          >
            <template #trigger>
              <Button
                variant="ghost"
                size="xs"
                block
                class="text-muted justify-start rounded-xs"
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
                  variant="warning"
                  class="mr-2 ml-auto"
                  data-test-key="session-nest-count"
                >
                  {{ nestOf(node).length }}
                </Badge>
              </Button>
            </template>

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
                  :src="client.avatar?.src"
                  :alt="client.avatar?.caption"
                  :force-caption="client.avatar?.forceCaption"
                >
                  <template #fallback>{{ client.avatar?.caption }}</template>
                </Avatar>
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
                  class="text-success"
                />
                <Badge
                  v-if="client.expiresAt"
                  size="sm"
                  appearance="muted"
                  :variant="expiryColor(client.expiresAt)"
                >
                  <Icon icon="clock" size="xs" />
                  {{ useRelativeTime(client.expiresAt) }}
                </Badge>
                <Tooltip :label="t('labs.session_exit_impersonation')">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon-only
                    class="text-danger"
                    :aria-label="t('labs.session_exit_impersonation')"
                    @click.stop="logoutSession(client.actor, client.id)"
                  >
                    <Icon icon="log-out-01" size="xs" />
                  </Button>
                </Tooltip>
              </span>
            </DropdownMenuItem>
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
          block
          class="justify-start"
          :data-attrs="{ 'data-test-key': getAddSessionTestKey(scope) }"
          @click="addSession(scope)"
        >
          <Icon
            :icon="scope === ScopeActorTypes.CLIENT ? 'log-in-01' : 'log-in-02'"
            size="xs"
          />
          {{ t(getAddSessionLabel(scope)) }}
        </Button>
      </template>

      <Button
        v-if="canUseGuestMode"
        variant="ghost"
        size="sm"
        block
        class="justify-start"
        :data-attrs="{ 'data-test-key': 'actor-scope-add-guest' }"
        @click="switchScope(ScopeActorTypes.GUEST)"
      >
        <Icon icon="user-circle" size="xs" />
        {{ t("labs.session_guest") }}
      </Button>

      <!-- Impersonation (FE-2973 Task 5) -->
      <Collapsible v-if="hasStaffAccess" v-model:open="impersonateOpen">
        <template #trigger>
          <Button
            variant="ghost"
            size="sm"
            block
            class="justify-start"
            :data-attrs="{ 'data-test-key': 'impersonate-trigger' }"
          >
            <Icon icon="eye" size="xs" />
            {{ t("labs.session_impersonate") }}
            <Icon
              :icon="impersonateOpen ? 'chevron-up' : 'chevron-down'"
              size="xs"
              class="ml-auto"
            />
          </Button>
        </template>

        <div class="mt-2 flex flex-col gap-2">
          <!-- Type toggle -->
          <div class="flex gap-1">
            <Button
              :variant="impersonateType === 'client' ? 'secondary' : 'ghost'"
              size="xs"
              class="flex-1"
              :data-attrs="{ 'data-test-key': 'impersonate-type-client' }"
              @click="switchImpersonateType('client')"
            >
              <Icon icon="user-01" size="xs" />
              {{ t("labs.actor_client") }}
            </Button>
            <Button
              :variant="impersonateType === 'staff' ? 'secondary' : 'ghost'"
              size="xs"
              class="flex-1"
              :data-attrs="{ 'data-test-key': 'impersonate-type-staff' }"
              @click="switchImpersonateType('staff')"
            >
              <Icon icon="building-07" size="xs" />
              {{ t("labs.actor_staff") }}
            </Button>
          </div>

          <!-- Single search input -->
          <Input
            :model-value="impersonateQuery"
            :placeholder="impersonatePlaceholder"
            size="sm"
            :data-attrs="{ 'data-test-key': 'impersonate-search' }"
            @update:model-value="onImpersonateSearch"
            @keydown.stop
          >
            <template #leading>
              <Icon
                :icon="impersonateType === 'client' ? 'user-01' : 'building-07'"
                size="xs"
                class="text-muted"
              />
            </template>
            <template v-if="isSearching" #trailing>
              <Icon
                icon="loader-circle"
                size="xs"
                class="text-muted animate-spin"
              />
            </template>
          </Input>

          <!-- Results -->
          <div
            v-if="impersonateResults.length"
            class="max-h-32 overflow-y-auto"
          >
            <Button
              v-for="result in impersonateResults"
              :key="result.id"
              variant="ghost"
              size="xs"
              block
              class="justify-start"
              :data-attrs="{
                'data-test-key': 'impersonate-result',
                'data-test-value': result.id
              }"
              @click="doImpersonate(result.id)"
            >
              <Icon
                :icon="impersonateType === 'client' ? 'user-01' : 'building-07'"
                size="xs"
              />
              {{ result.label }}
            </Button>
          </div>
        </div>
      </Collapsible>
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

import {
  Avatar,
  Badge,
  Button,
  Collapsible,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  Input,
  Tooltip
} from "@upmind/ui";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import {
  ScopeActorTypes,
  useQuery,
  useRelativeTime,
  useSessionStore
} from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import { nestChevron, sessionItem } from "./SessionSwitcher.styles";
import { useActorScopeSelector } from "./useActorScopeSelector";
import { debounce, find, isEmpty, map, reject, some } from "lodash-es";
import type { SessionItem, StaffSessionNode } from "./useActorScopeSelector";
import type { IClient, IUser } from "@upmind-automation/types";
import {
  impersonateClient as impersonateClientService,
  impersonateUser as impersonateUserService
} from "~/services/impersonation";
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

// --- Impersonation search (FE-2973 Task 5)
const { get: queryGet, useUrl } = useQuery();
const { add: addSessionToStore } = store.useActions();

const impersonateOpen = ref(false);
const impersonateType = ref<"client" | "staff">("client");
const impersonateQuery = ref("");
const impersonateResults = ref<Array<{ id: string; label: string }>>([]);
const isSearching = ref(false);

const impersonatePlaceholder = computed(() =>
  impersonateType.value === "client"
    ? t("labs.session_impersonate_client")
    : t("labs.session_impersonate_staff")
);

function switchImpersonateType(type: "client" | "staff") {
  impersonateType.value = type;
  impersonateQuery.value = "";
  impersonateResults.value = [];
}

const debouncedSearch = debounce(
  async (query: string, type: "client" | "staff") => {
    if (!query || query.length < 2) {
      impersonateResults.value = [];
      isSearching.value = false;
      return;
    }
    isSearching.value = true;
    try {
      if (type === "client") {
        const response = await queryGet<{ data: IClient[] }>({
          queryKey: ["impersonate-client-search", query],
          url: useUrl("admin/clients", { query, limit: 12 }),
          staleTime: 30000
        });
        impersonateResults.value = map(response.data, client => ({
          id: client.id,
          label: client.fullname || client.email || client.id
        }));
      } else {
        const response = await queryGet<{ data: IUser[] }>({
          queryKey: ["impersonate-staff-search", query],
          url: useUrl("admin/users", { query, limit: 12 }),
          staleTime: 30000
        });
        impersonateResults.value = map(response.data, user => ({
          id: user.id,
          label: user.fullname || user.email || user.id
        }));
      }
    } catch {
      impersonateResults.value = [];
    } finally {
      isSearching.value = false;
    }
  },
  300
);

function onImpersonateSearch(query: string) {
  impersonateQuery.value = query;
  debouncedSearch(query, impersonateType.value);
}

async function doImpersonate(id: string) {
  if (impersonateType.value === "client") {
    await impersonateClient(id);
  } else {
    await impersonateStaff(id);
  }
  impersonateQuery.value = "";
  impersonateResults.value = [];
  impersonateOpen.value = false;
}

async function impersonateClient(clientId: string): Promise<void> {
  try {
    const token = await impersonateClientService(clientId);
    await addSessionToStore(token);
    clientSearchQuery.value = "";
    clientSearchResults.value = [];
  } catch (e) {
    console.error("[SessionSwitcher] Failed to impersonate client:", e);
  }
}

async function impersonateStaff(userId: string): Promise<void> {
  try {
    const token = await impersonateUserService(userId);
    await addSessionToStore(token);
    staffSearchQuery.value = "";
    staffSearchResults.value = [];
  } catch (e) {
    console.error("[SessionSwitcher] Failed to impersonate staff:", e);
  }
}

const hasStaffAccess = computed(
  () => store.useContext().activeActor.value === AccessRoleTypes.STAFF
);

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
