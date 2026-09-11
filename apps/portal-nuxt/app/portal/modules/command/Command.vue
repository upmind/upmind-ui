<template>
  <PortalButton
    variant="outline"
    size="sm"
    class="w-80 justify-start gap-2"
    v-bind="useTestAttrs({ key: 'portal-command-trigger' })"
    @click="open = true"
  >
    <Search class="size-4 shrink-0" aria-hidden="true" />
    <span class="flex-1 text-left">{{ props.label }}</span>
    <Kbd>⌘</Kbd><Kbd>K</Kbd>
  </PortalButton>

  <CommandDialog v-model:open="open" :title="props.title">
    <CommandInput :placeholder="props.placeholder" />
    <CommandList>
      <CommandEmpty>{{ props.emptyLabel }}</CommandEmpty>
      <CommandGroup :heading="props.heading">
        <CommandItem
          v-for="item in props.items"
          :key="item.value"
          :value="item.value"
          @select="pick(item.value)"
        >
          {{ item.label }}
          <CommandShortcut v-if="item.shortcut">{{
            item.shortcut
          }}</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/command/Command
 * @description The `command` module — the app shell's ⌘K launcher, seated in
 * the topbar by config. A trigger button beside the palette it opens; every
 * pick emits its value through the action seam (mock/actions.ts), so a
 * destination rides the `navigate:` verb like every other module's.
 *
 * `CommandDialog` mounts its own `CommandRoot` around the slot, so the PARTS
 * go in here — never the prop-first `Command`, which would nest a second root.
 */
import {
  Button as PortalButton,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Kbd,
  useTestAttrs
} from "@upmind/ui";
import { useEventListener } from "@vueuse/core";
import { Search } from "lucide-vue-next";
import { ref } from "vue";
import type { CommandModuleEmits, CommandModuleProps } from "./types";

// Two roots (the trigger and its dialog), so the host's `variant` attribute
// has nowhere to land — and this module has no variants to take it.
defineOptions({ name: "PortalCommand", inheritAttrs: false });

const props = defineProps<CommandModuleProps>();
const emits = defineEmits<CommandModuleEmits>();

const open = ref(false);

function pick(value: string) {
  open.value = false;
  emits("select", value);
}

// The shortcut the trigger advertises. Bound on the document, because the
// launcher is global chrome — a listener on the button itself would only fire
// while the button already had focus, which is the one time it is not needed.
useEventListener(document, "keydown", (event: KeyboardEvent) => {
  if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  open.value = !open.value;
});
</script>
