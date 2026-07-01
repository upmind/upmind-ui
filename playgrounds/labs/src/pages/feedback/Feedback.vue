<template>
  <UpmLayout>
    <div class="container mx-auto max-w-4xl p-4">
      <h1 class="mb-6 text-center text-3xl font-bold">Feedback Manager</h1>

      <!-- Outer Card: This uses your custom Card component -->
      <Card class="mb-6 space-y-6">
        <!-- Section for Adding Messages -->
        <section>
          <h2 class="mb-4 text-xl font-semibold">Add New Message</h2>
          <div class="flex flex-wrap gap-4">
            <Button @click="handleAddWarning" variant="subtle"
              >Add Info Toast</Button
            >
            <Button @click="handleAddSuccess" variant="subtle"
              >Add Success Notification</Button
            >
            <Button @click="handleAddError" variant="subtle"
              >Add Error System Message</Button
            >
            <Button @click="handleAddGenericToast" variant="outline"
              >Add Generic Toast</Button
            >
          </div>
        </section>

        <!-- Section for Dismissing Messages by ID -->
        <section>
          <h2 class="mb-4 text-xl font-semibold">Dismiss Message by ID</h2>
          <div class="flex items-end gap-4">
            <div class="flex-1">
              <Label for="message-id-input" class="sr-only"
                >Enter message ID</Label
              >
              <Input
                id="message-id-input"
                v-model="messageToDismissId"
                placeholder="Enter message ID"
                aria-label="Message ID to dismiss"
                class="w-full"
              />
            </div>
            <Button
              @click="handleDismissById"
              variant="outline"
              class="shrink-0"
              >Dismiss</Button
            >
          </div>
        </section>
      </Card>

      <hr class="border-muted my-8 border-t" />

      <!-- Notifications Section -->
      <section class="mb-6">
        <h2 class="mb-4 text-2xl font-semibold">
          Notifications ({{ notifications.length }})
        </h2>
        <div
          v-if="notifications.length === 0"
          class="text-muted-foreground italic"
        >
          No notifications.
        </div>
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            v-for="notificationItem in notifications"
            :key="notificationItem.id"
            class="transition-all"
          >
            <!-- Mimicking CardHeader -->
            <div class="border-border mb-3 border-b pb-3">
              <div
                class="flex items-center justify-between text-lg font-semibold"
              >
                <span>ID: {{ notificationItem.id.substring(0, 8) }}...</span>
                <Badge
                  :color="
                    getMessageTypeBadgeVariant(
                      notificationItem.state.value.context.type
                    )
                  "
                >
                  {{ notificationItem.state.value.context.type }}
                </Badge>
              </div>
              <p class="text-muted-foreground mt-1 text-sm">
                Display:
                <Badge
                  :color="
                    getBadgeVariant(
                      notificationItem.state.value.context.display
                    )
                  "
                  class="ml-1"
                >
                  {{ notificationItem.state.value.context.display }}
                </Badge>
              </p>
            </div>
            <!-- Mimicking CardContent -->
            <div class="pb-4 text-sm">
              <p
                v-if="notificationItem.state.value.context.title"
                class="mb-1 font-semibold"
              >
                {{ notificationItem.state.value.context.title }}
              </p>
              <p>{{ notificationItem.state.value.context.copy }}</p>
              <p class="text-muted-foreground mt-2 text-xs">
                State: {{ notificationItem.state.value.value }}
              </p>
            </div>
            <!-- Mimicking CardFooter -->
            <div
              class="border-border mt-auto flex justify-end gap-2 border-t pt-4"
            >
              <Button
                @click="notificationItem.send({ type: 'DISMISS' })"
                variant="outline"
                size="sm"
              >
                Dismiss (Local Actor)
              </Button>
              <Button
                @click="dismiss(notificationItem.id)"
                variant="solid"
                color="danger"
                size="sm"
              >
                Dismiss (Main Service)
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <!-- Toasts Section (repeats the pattern for notifications) -->
      <section class="mb-6">
        <h2 class="mb-4 text-2xl font-semibold">
          Toasts ({{ toasts.length }})
        </h2>
        <div v-if="toasts.length === 0" class="text-muted-foreground italic">
          No toasts.
        </div>
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            v-for="toastItem in toasts"
            :key="toastItem.id"
            class="transition-all"
          >
            <div class="border-border mb-3 border-b pb-3">
              <div
                class="flex items-center justify-between text-lg font-semibold"
              >
                <span>ID: {{ toastItem.id.substring(0, 8) }}...</span>
                <Badge
                  :color="
                    getMessageTypeBadgeVariant(
                      toastItem.state.value.context.type
                    )
                  "
                >
                  {{ toastItem.state.value.context.type }}
                </Badge>
              </div>
              <p class="text-muted-foreground mt-1 text-sm">
                Display:
                <Badge
                  :color="
                    getBadgeVariant(toastItem.state.value.context.display)
                  "
                  class="ml-1"
                >
                  {{ toastItem.state.value.context.display }}
                </Badge>
              </p>
            </div>
            <div class="pb-4 text-sm">
              <p
                v-if="toastItem.state.value.context.title"
                class="mb-1 font-semibold"
              >
                {{ toastItem.state.value.context.title }}
              </p>
              <p>{{ toastItem.state.value.context.copy }}</p>
              <p class="text-muted-foreground mt-2 text-xs">
                State: {{ toastItem.state.value.value }}
              </p>
            </div>
            <div
              class="border-border mt-auto flex justify-end gap-2 border-t pt-4"
            >
              <Button
                @click="toastItem.send({ type: 'DISMISS' })"
                variant="outline"
                size="sm"
              >
                Dismiss (Local Actor)
              </Button>
              <Button
                @click="dismiss(toastItem.id)"
                variant="solid"
                color="danger"
                size="sm"
              >
                Dismiss (Main Service)
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <!-- System Messages Section (repeats the pattern for notifications) -->
      <section class="mb-6">
        <h2 class="mb-4 text-2xl font-semibold">
          System Messages ({{ system.length }})
        </h2>
        <div v-if="system.length === 0" class="text-muted-foreground italic">
          No system messages.
        </div>
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            v-for="systemItem in system"
            :key="systemItem.id"
            class="transition-all"
          >
            <div class="border-border mb-3 border-b pb-3">
              <div
                class="flex items-center justify-between text-lg font-semibold"
              >
                <span>ID: {{ systemItem.id.substring(0, 8) }}...</span>
                <Badge
                  :color="
                    getMessageTypeBadgeVariant(
                      systemItem.state.value.context.type
                    )
                  "
                >
                  {{ systemItem.state.value.context.type }}
                </Badge>
              </div>
              <p class="text-muted-foreground mt-1 text-sm">
                Display:
                <Badge
                  :color="
                    getBadgeVariant(systemItem.state.value.context.display)
                  "
                  class="ml-1"
                >
                  {{ systemItem.state.value.context.display }}
                </Badge>
              </p>
            </div>
            <div class="pb-4 text-sm">
              <p
                v-if="systemItem.state.value.context.title"
                class="mb-1 font-semibold"
              >
                {{ systemItem.state.value.context.title }}
              </p>
              <p>{{ systemItem.state.value.context.copy }}</p>
              <p class="text-muted-foreground mt-2 text-xs">
                State: {{ systemItem.state.value.value }}
              </p>
            </div>
            <div
              class="border-border mt-auto flex justify-end gap-2 border-t pt-4"
            >
              <Button
                @click="systemItem.send({ type: 'DISMISS' })"
                variant="outline"
                size="sm"
              >
                Dismiss (Local Actor)
              </Button>
              <Button
                @click="dismiss(systemItem.id)"
                variant="solid"
                color="danger"
                size="sm"
              >
                Dismiss (Main Service)
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  useFeedback,
  messageTypes,
  messageDisplays,
  UpmLayout
} from "@upmind-automation/client-vue";
import {
  Card,
  Label,
  Input,
  Button,
  Badge
} from "@upmind-automation/upmind-ui";

// Destructure the reactive state and methods from the composable
const {
  notifications,
  toasts,
  system,
  addError,
  addWarning,
  addSuccess,
  add, // Direct add for generic messages
  dismiss // The dismiss function that sends to the main service
} = useFeedback();

// Reactive variable for the dismiss by ID input
const messageToDismissId = ref("");

// --- Handlers for adding messages
function handleAddWarning() {
  addWarning(`This is an info toast! Time: ${new Date().toLocaleTimeString()}`);
}

function handleAddSuccess() {
  addSuccess(
    `Success! Your operation completed. Time: ${new Date().toLocaleTimeString()}`,
    messageDisplays.NOTIFICATION
  );
}

function handleAddError() {
  addError(
    { copy: "Something went wrong! Please try again later." },
    messageDisplays.INTERSTITIAL
  );
}

function handleAddGenericToast() {
  add({
    type: messageTypes.INFO,
    copy: `A generic toast added. ${new Date().toLocaleTimeString()}`,
    display: messageDisplays.TOAST,
    maxAge: 3000 // Disappear after 3 seconds
  });
}

// --- Handler for dismissing a message by ID
function handleDismissById() {
  if (messageToDismissId.value) {
    dismiss(messageToDismissId.value);
    messageToDismissId.value = ""; // Clear input after sending
  } else {
    alert("Please enter a message ID to dismiss.");
  }
}

// Helper to determine badge color based on the message display type
function getBadgeVariant(
  displayType: messageDisplays
): "primary" | "info" | "danger" | "neutral" {
  switch (displayType) {
    case messageDisplays.NOTIFICATION:
      return "primary";
    case messageDisplays.TOAST:
      return "info";
    case messageDisplays.INTERSTITIAL:
      return "danger";
    default:
      return "neutral";
  }
}

// Helper to determine badge color based on message type (ERROR, SUCCESS, INFO)
function getMessageTypeBadgeVariant(
  messageType: messageTypes
): "danger" | "success" | "info" | "neutral" {
  switch (messageType) {
    case messageTypes.ERROR:
      return "danger";
    case messageTypes.SUCCESS:
      return "success";
    case messageTypes.INFO:
      return "info";
    default:
      return "neutral";
  }
}
</script>
