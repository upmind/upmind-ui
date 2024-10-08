<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        color="primary"
        :disabled="loading"
        :class="cn(variants.dropdownMenu.button, props.class)"
      >
        <span class="flex items-center truncate">
          <Avatar
            v-if="value?.icon"
            :icon="value.icon"
            size="3xs"
            shape="circle"
            fit="cover"
            class="mr-2 shrink-0"
            aria-hidden="true"
          />
          <span v-if="!hideLabel">{{ value?.label || label }}</span>
        </span>

        <!-- <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" /> -->

        <Icon
          v-if="!loading"
          class="ml-2 h-4 w-4 shrink-0 rotate-180 bg-transparent bg-opacity-0 opacity-50 transition-all duration-200"
          icon="arrow-up" />

        <UpwSpinner
          size="xs"
          v-else
          class="-mr-1 ml-2 mt-1 shrink-0 opacity-50"
      /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[200px]">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <User class="mr-2 h-4 w-4" />
          Assign to...
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Calendar class="mr-2 h-4 w-4" />
          Set due date...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tags class="mr-2 h-4 w-4" />
            Apply label
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent class="p-0">
            <Command>
              <CommandInput placeholder="Filter label..." auto-focus />
              <CommandList>
                <CommandEmpty>No label found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    v-for="label in labels"
                    :key="label"
                    :value="label"
                    @select="
                      ev => {
                        labelRef = ev.detail.value as string;
                        open = false;
                      }
                    "
                  >
                    {{ label }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-red-600">
          <Trash class="mr-2 h-4 w-4" />
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Calendar, MoreHorizontal, Tags, Trash, User } from "lucide-vue-next";

import { Button } from "../button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";

import DropdownMenu from "./DropdownMenu.ce.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuGroup from "./DropdownMenuGroup.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";
import DropdownMenuLabel from "./DropdownMenuLabel.vue";
import DropdownMenuSeparator from "./DropdownMenuSeparator.vue";
import DropdownMenuShortcut from "./DropdownMenuShortcut.vue";
import DropdownMenuSub from "./DropdownMenuSub.vue";
import DropdownMenuSubContent from "./DropdownMenuSubContent.vue";
import DropdownMenuSubTrigger from "./DropdownMenuSubTrigger.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";

const labels = [
  "feature",
  "bug",
  "enhancement",
  "documentation",
  "design",
  "question",
  "maintenance",
];

const labelRef = ref("feature");
const open = ref(false);
</script>
