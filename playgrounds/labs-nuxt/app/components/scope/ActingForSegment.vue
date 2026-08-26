<template>
  <DropdownMenu v-if="hasClients" :items="[]" class="w-80">
    <template #trigger>
      <Button
        :class="
          isActing ? 'bg-control-selected text-control-selected' : 'text-muted'
        "
        size="sm"
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'acting-for' }"
      >
        <Icon :icon="triggerIcon" size="xs" />
        {{ triggerLabel }}
        <Icon icon="chevron-down" size="xs" />
      </Button>
    </template>

    <DropdownMenuLabel
      class="text-muted border-surface border-b text-xs tracking-wider uppercase"
    >
      {{ t("labs.acting_for_pick_client") }}
    </DropdownMenuLabel>

    <div class="p-2">
      <Input
        v-model="clientIdInput"
        :placeholder="t('labs.acting_for_id_placeholder')"
        size="sm"
        :data-attrs="{ 'data-test-key': 'acting-for-id-input' }"
        @keydown.stop
        @keyup.enter="applyClientId"
      >
        <template #leading>
          <Icon icon="user-01" size="xs" class="text-muted" />
        </template>
        <template v-if="clientIdInput.trim()" #trailing>
          <Button
            variant="ghost"
            size="xs"
            :data-attrs="{ 'data-test-key': 'acting-for-id-apply' }"
            @click="applyClientId"
          >
            <Icon icon="arrow-right" size="xs" />
          </Button>
        </template>
      </Input>
    </div>

    <DropdownMenuGroup class="flex flex-col p-1">
      <DropdownMenuItem
        v-for="client in availableClients"
        :key="String(client.id)"
        :data-attrs="{
          'data-test-key': 'acting-for-client',
          'data-test-value': client.id
        }"
        @select="selectClient(client)"
      >
        <span class="flex min-w-0 items-center gap-2">
          <Avatar size="sm" :alt="client.name">
            <template #fallback>
              <span class="text-xs font-medium">{{
                initials(client.name)
              }}</span>
            </template>
          </Avatar>
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-medium">{{ client.name }}</span>
            <span v-if="client.email" class="text-muted truncate text-xs">
              {{ client.email }}
            </span>
          </span>
        </span>
      </DropdownMenuItem>

      <p
        v-if="!availableClients.length && !isActing"
        class="text-muted py-4 text-center text-sm"
      >
        {{ t("labs.acting_for_no_clients") }}
      </p>
    </DropdownMenuGroup>

    <div v-if="isActing" class="bg-canvas border-surface border-t p-2">
      <div class="flex items-center gap-2">
        <Avatar size="sm" :alt="activeClientLabel">
          <template #fallback>
            <span class="text-xs font-medium">{{
              initials(activeClientLabel)
            }}</span>
          </template>
        </Avatar>
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-medium">{{
            activeClientLabel
          }}</span>
          <span class="text-muted text-xs">{{ t("labs.acting_for") }}</span>
        </span>
        <Tooltip :label="t('labs.acting_for_clear')">
          <Button
            size="sm"
            variant="ghost"
            icon-only
            :aria-label="t('labs.acting_for_clear')"
            :data-attrs="{ 'data-test-key': 'acting-for-clear' }"
            @click="clear"
          >
            <Icon icon="x-close" size="xs" />
          </Button>
        </Tooltip>
      </div>
    </div>
  </DropdownMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ActingForSegment
 * @description Client picker for the scope bar. Matches SessionSwitcher structure.
 * Client ID entry input, available clients list, active client at bottom with clear.
 */

import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  Input,
  Tooltip
} from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/client-vue";
import { useSessionStore } from "@upmind-automation/headless";
import {
  buildScopePath,
  useActorScope,
  useContextScope
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { impersonateClient } from "../../services/impersonation";
import { useContextScopeSelector } from "./useContextScopeSelector";
import { filter, find, get, has, isEmpty, map, reject } from "lodash-es";
import type { SessionEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

interface ClientOption {
  id: string;
  name: string;
  email?: string;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const actorScope = useActorScope();
const currentContext = useContextScope();
const { preserveQuery } = usePlaygroundUrlState();
const { recentContexts, remember } = useContextScopeSelector();

const store = useSessionStore();
const { clientSessions } = store.useContext();
const { isAvailable } = store.useMeta();

const clientIdInput = ref("");

const isActing = computed(() => !!currentContext.value);

const brandId = computed(() => route.params.brandIdOrOrg as string | undefined);

const page = computed(() => {
  const segments = filter(route.path.split("/"), Boolean);
  return (brandId.value ? segments[1] : segments[0]) ?? "";
});

const triggerLabel = computed(() =>
  currentContext.value
    ? t("labs.acting_for_active", { label: labelFor(currentContext.value.id) })
    : t("labs.acting_for_none")
);

const triggerIcon = computed(() =>
  currentContext.value ? "layers-three-01" : "user-square"
);

const pool = computed<Record<string, SessionEntry>>(() =>
  isAvailable.value ? clientSessions.value : {}
);

const poolClients = computed<ClientOption[]>(() =>
  map(pool.value, (entry, id) => ({
    id,
    name:
      entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id,
    email: entry.user?.email
  }))
);

const recentClients = computed<ClientOption[]>(() => {
  const poolIds = new Set(map(poolClients.value, "id"));
  return map(
    reject(
      filter(recentContexts.value, r => r.type === "client"),
      r => poolIds.has(r.id)
    ),
    r => ({ id: r.id, name: r.label ?? r.id, email: undefined })
  );
});

const allClients = computed<ClientOption[]>(() => [
  ...poolClients.value,
  ...recentClients.value
]);

const availableClients = computed<ClientOption[]>(() => {
  const activeId = currentContext.value?.id;
  if (!activeId) return allClients.value;
  return reject(allClients.value, c => c.id === activeId);
});

const activeClientLabel = computed(() => {
  if (!currentContext.value) return "";
  return labelFor(currentContext.value.id);
});

const hasClients = computed(() => !isEmpty(allClients.value) || isActing.value);

function initials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function labelFor(id: string): string {
  const entry = get(pool.value, id);
  if (entry) {
    return (
      entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id
    );
  }
  const recent = find(recentContexts.value, ["id", id]);
  if (recent?.label) return recent.label;
  return id;
}

async function applyClientId(): Promise<void> {
  const id = clientIdInput.value.trim();
  if (!id) return;

  const isInPool = has(pool.value, id);

  if (!isInPool) {
    try {
      const token = await impersonateClient(id);
      const { registerImpersonation, add } = store.useActions();
      registerImpersonation(id);
      await add(token);
    } catch {
      return;
    }
  }

  await applyContext(id, id);
}

async function selectClient(client: ClientOption): Promise<void> {
  const isInPool = has(pool.value, client.id);

  if (!isInPool) {
    try {
      const token = await impersonateClient(client.id);
      const { registerImpersonation, add } = store.useActions();
      registerImpersonation(client.id);
      await add(token);
    } catch {
      return;
    }
  }

  await applyContext(client.id, client.name);
}

async function applyContext(id: string, label: string): Promise<void> {
  if (isEmpty(id)) return;

  remember({ type: "client", id, label });
  clientIdInput.value = "";

  await router
    .push(
      preserveQuery(
        buildScopePath({
          page: page.value,
          brandId: brandId.value,
          actor: actorScope.value,
          context: { type: "client", id }
        })
      )
    )
    .catch(() => undefined);
}

async function clear(): Promise<void> {
  await router.push(
    preserveQuery(
      buildScopePath({
        page: page.value,
        brandId: brandId.value,
        actor: actorScope.value
      })
    )
  );
}
</script>
