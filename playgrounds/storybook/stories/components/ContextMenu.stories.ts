// --- external

// -- components
import { ContextMenu } from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { ContextMenuItemProps } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof ContextMenu> = {
  component: ContextMenu,
  args: {
    title: "Actions",
    items: [
      {
        label: "Edit",
        value: "edit",
        icon: "edit-05",
        handler: () => alert("Edit clicked!")
      },
      {
        label: "Duplicate",
        value: "duplicate",
        icon: "copy-01",
        handler: () => alert("Duplicate clicked!")
      },
      {
        label: "Delete",
        value: "delete",
        icon: "trash-01",
        handler: () => alert("Delete clicked!")
      }
    ] as ContextMenuItemProps[]
  },
  render: args => ({
    components: { ContextMenu },
    setup() {
      return { args };
    },
    template: `
      <ContextMenu v-bind="args">
        <template #trigger>
          <div class="text-muted flex h-40 w-full items-center justify-center rounded-md border border-dashed text-sm">
            Right-click here
          </div>
        </template>
      </ContextMenu>
    `
  }),
  parameters: {
    docs: {
      description: {
        component:
          "A right-click menu rendered from an `items` array; each item fires its `handler` on select."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Base: Story = {};
