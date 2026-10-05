<template>
  <DropdownMenu v-if="hasMembers || isActing" :items="[]" class="w-80">
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
      {{ t("labs.acting_for_pick_context") }}
    </DropdownMenuLabel>

    <!-- SELECTOR members: the type IS the whole answer, so each is one row and
         picking it is the whole act. -->
    <DropdownMenuGroup
      v-if="availableSelectorMembers.length"
      class="flex flex-col p-1"
    >
      <DropdownMenuItem
        v-for="member in availableSelectorMembers"
        :key="member.type"
        :data-attrs="{
          'data-test-key': 'acting-for-context',
          'data-test-value': member.type
        }"
        @select="selectMember(member)"
      >
        <span class="truncate text-sm font-medium">
          {{ startCase(member.type) }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuGroup>

    <!-- RETARGET members: ONE form over every context the matrix declares,
         when the page's module publishes one (`schemas.lookups`). The form has
         no actions: a lookup write IS the pick, a typed client id applies on
         Enter. -->
    <div
      v-if="contextForm"
      class="p-2"
      @keydown.stop
      @keydown.enter="applyPendingClient"
    >
      <Form
        :schema="contextForm.schema"
        :uischema="contextForm.uischema"
        :model-value="contextModel"
        no-actions
        size="sm"
        @update:model-value="onContextPick"
      />
    </div>

    <!-- A module with no lookups form: each RETARGET member takes a typed id.
         `client` has none anywhere: no endpoint a client token can reach
         lists other clients, so it stays a typed id (G1, FE-3029). -->
    <template v-else>
      <div v-for="member in retargetMembers" :key="member.type" class="p-2">
        <Input
          v-model="idInputs[member.type]"
          :placeholder="
            t('labs.acting_for_id_placeholder', {
              type: startCase(member.type)
            })
          "
          size="sm"
          :data-attrs="{
            'data-test-key': 'acting-for-id-input',
            'data-test-value': member.type
          }"
          @keydown.stop
          @keyup.enter="applyId(member)"
        >
          <template v-if="trim(idInputs[member.type])" #trailing>
            <Button
              variant="ghost"
              size="xs"
              :data-attrs="{
                'data-test-key': 'acting-for-id-apply',
                'data-test-value': member.type
              }"
              @click="applyId(member)"
            >
              <Icon icon="arrow-right" size="xs" />
            </Button>
          </template>
        </Input>
      </div>
    </template>

    <!-- A client is the one entity the session store already knows by name, so
         the known sessions are offered as rows. -->
    <DropdownMenuGroup v-if="clientMember" class="flex flex-col p-1">
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

    <p v-if="!hasMembers" class="text-muted py-4 text-center text-sm">
      {{ t("labs.acting_for_no_contexts") }}
    </p>

    <!-- The active context, whatever its pattern, and the one way out of it. -->
    <div
      v-if="isActing"
      class="bg-canvas border-surface flex items-center gap-2 border-t p-2"
    >
      <Avatar v-if="isRetargeting" size="sm" :alt="activeLabel">
        <template #fallback>
          <span class="text-xs font-medium">{{ initials(activeLabel) }}</span>
        </template>
      </Avatar>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ activeLabel }}</span>
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
  </DropdownMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ActingForSegment
 * @description The scope bar's "acting for" picker. It is driven by the scope
 * matrix the page registered, and by nothing else: every context member the
 * matrix declares for the url's actor is offered, and the member's PATTERN
 * decides how it is picked.
 *
 * - A RETARGET member names an entity, so it takes an id. The row is an id
 *   field for that type. For `client` — the one entity the session store
 *   already knows — the held client sessions are offered beneath the field and
 *   an unknown id is impersonated into the pool first.
 * - A SELECTOR member IS the whole answer (which catalogue), so it is one row
 *   and picking it is the act. No id, no session, nothing to remember.
 *
 * Either way the pick is ONE scope write — `updateScopeParam("context", …)` —
 * which becomes `/for/:type[/:id]` on the url, whatever actor the url names.
 * The page reads the context back off the route and boots `.for()` from it.
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
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Form, Icon } from "@upmind-automation/foundation";
import {
  ScopeActorTypes,
  ScopeContextPatterns,
  useSessionStore
} from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  useActorScope,
  useContextScope,
  useScopeNavigation
} from "../../composables/scope";
import { impersonateClient } from "../../services/impersonation";
import { useContextScopeSelector } from "./useContextScopeSelector";
import {
  filter,
  find,
  get,
  has,
  isEmpty,
  map,
  reject,
  startCase,
  trim,
  uniqBy
} from "lodash-es";
import type { AvailableContext } from "./useContextScopeSelector";
import type { SessionEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

interface ClientOption {
  id: string;
  name: string;
  email?: string;
}

const { t } = useI18n();
const actorScope = useActorScope();
const currentContext = useContextScope();
const { updateScopeParam } = useScopeNavigation();
const {
  availableContexts,
  contextForm,
  contextModel,
  pickContext,
  recentContexts,
  remember
} = useContextScopeSelector();

const store = useSessionStore();
const { activeActor, clientSessions } = store.useContext();
const { isAvailable } = store.useMeta();

const isActing = computed(() => !!currentContext.value);

// A RETARGET context names an entity by id; a SELECTOR one IS the whole answer
// and carries none. The two are mutually exclusive, so the id's presence is
// what tells the two apart on the active context.
const isRetargeting = computed(() => currentContext.value?.id !== undefined);

/** Whether a context type names a client — the entity the store knows by name. */
const isClientType = (type: string): boolean => type === AccessRoleTypes.CLIENT;

/**
 * The actor whose members are offered. A url naming none means SELF, and SELF
 * is whoever is active — so it resolves to that concrete actor rather than
 * standing for all of them. Offering the union would put a member of another
 * actor's cell in front of a hand that cannot use it: the pick would build a
 * url the module then refuses.
 *
 * Resolved off the store this component already holds, not through the scope
 * builder's own `resolveSelfActor`: same answer, one seam instead of two, and
 * it follows the store reactively as the active session changes.
 */
const resolvedActor = computed<string>(() =>
  actorScope.value === ScopeActorTypes.SELF
    ? (activeActor.value ?? AccessRoleTypes.GUEST)
    : actorScope.value
);

/**
 * Every member the registered matrix declares for that actor. A cell may name
 * the same type twice; the pattern and the type together are the identity.
 */
const members = computed<AvailableContext[]>(() =>
  uniqBy(
    filter(
      availableContexts.value,
      ctx => String(ctx.actor) === resolvedActor.value
    ),
    ctx => `${ctx.pattern}:${ctx.type}`
  )
);

const hasMembers = computed(() => !isEmpty(members.value));

const selectorMembers = computed<AvailableContext[]>(() =>
  filter(members.value, { pattern: ScopeContextPatterns.SELECTOR })
);

const retargetMembers = computed<AvailableContext[]>(() =>
  filter(members.value, { pattern: ScopeContextPatterns.RETARGET })
);

/** The selectors not already active — the active one is shown below, with clear. */
const availableSelectorMembers = computed<AvailableContext[]>(() =>
  reject(
    selectorMembers.value,
    member => member.type === currentContext.value?.type
  )
);

/** What the active context is called: the type, or the entity it names. */
const activeLabel = computed(() => {
  const context = currentContext.value;
  if (!context) return "";
  if (context.id === undefined) return startCase(context.type);
  return isClientType(context.type)
    ? labelFor(context.id)
    : `${startCase(context.type)} · ${context.id}`;
});

const triggerLabel = computed(() =>
  currentContext.value
    ? t("labs.acting_for_active", { label: activeLabel.value })
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
    filter(
      recentContexts.value,
      (r): r is (typeof recentContexts.value)[number] & { id: string } =>
        isClientType(r.type) && !!r.id && !poolIds.has(r.id)
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

/**
 * A client id that is not in the pool is impersonated into it first, so the
 * page reads as that client. Any other entity is named by id alone.
 */
async function ensureClientSession(id: string): Promise<boolean> {
  if (has(pool.value, id)) return true;

  return impersonateClient(id)
    .then(token => {
      const { registerImpersonation, add } = store.useActions();
      registerImpersonation(id);
      return add(token);
    })
    .then(() => true)
    .catch(() => false);
}

/**
 * Act for an entity — the one RETARGET write every path ends on. A client is
 * impersonated into the pool first, so the page reads as that client; a
 * refused impersonation is the one way this returns false.
 */
async function actFor(
  type: string,
  id: string,
  label?: string
): Promise<boolean> {
  if (isClientType(type) && !(await ensureClientSession(id))) return false;

  remember({
    type,
    id,
    label: label ?? (isClientType(type) ? labelFor(id) : id)
  });

  await updateScopeParam("context", { type, id });
  return true;
}

/** Act for a client the store already holds, or has held before. */
async function selectClient(client: ClientOption): Promise<void> {
  await actFor(AccessRoleTypes.CLIENT, client.id, client.name);
}

/** The client member, when the matrix declares one — it also lists sessions. */
const clientMember = computed(() =>
  find(retargetMembers.value, member => isClientType(member.type))
);

/** The typed ids of the plain fallback, one per RETARGET member. */
const idInputs = reactive<Record<string, string>>({});

/** Act for the id typed into a member's plain field; a refused id stays put. */
async function applyId(member: AvailableContext): Promise<void> {
  const id = trim(idInputs[member.type] ?? "");
  if (!id) return;

  if (await actFor(member.type, id)) idInputs[member.type] = "";
}

/**
 * The client id typed into the form, held until Enter. A plain field writes
 * on every keystroke, and a client pick impersonates, so the keystroke is not
 * the pick. A lookup pick names a whole record and applies at once.
 */
const pendingClientId = ref<string>();

/** Act for whichever context the form write names. */
async function onContextPick(value: Record<string, unknown>): Promise<void> {
  const context = pickContext(value);
  if (!context?.id) return;

  if (isClientType(context.type)) {
    pendingClientId.value = context.id;
    return;
  }

  await actFor(context.type, context.id);
}

/** Enter in the form applies the held client id. */
async function applyPendingClient(): Promise<void> {
  const id = pendingClientId.value;
  if (!id) return;

  if (await actFor(AccessRoleTypes.CLIENT, id))
    pendingClientId.value = undefined;
}

/** Act for a SELECTOR member — the type is the whole answer. */
async function selectMember(member: AvailableContext): Promise<void> {
  await updateScopeParam("context", { type: member.type });
}

async function clear(): Promise<void> {
  await updateScopeParam("context", undefined);
}
</script>
