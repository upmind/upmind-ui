// --- external
import { computed, readonly, ref } from "vue";

// --- types
import type { AnnouncementOptions } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const announcement = ref<AnnouncementOptions | null>(null);

// -----------------------------------------------------------------------------
/**
 * Composable to manage page-level announcements.
 * Uses a module-level singleton so any component can show/dismiss announcements.
 */
export const useAnnouncement = () => {
  const isVisible = computed(() => !!announcement.value);

  /**
   * Show an announcement banner.
   * @param options - The announcement configuration
   */
  function show(options: AnnouncementOptions) {
    announcement.value = { icon: "x-close", ...options };
  }

  /**
   * Dismiss the current announcement.
   * Fires the onAction callback if provided.
   */
  function dismiss() {
    announcement.value = null;
  }

  return {
    announcement: readonly(announcement),
    isVisible,
    show,
    dismiss
  };
};
