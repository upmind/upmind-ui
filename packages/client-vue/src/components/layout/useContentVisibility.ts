// -----------------------------------------------------------------------------
/**
 * @internal
 * @module layout/useContentVisibility
 * @description Composable to track whether a template ref has significant DOM
 * content (non-comment, non-whitespace). Uses a MutationObserver to reactively
 * update visibility when teleported or dynamic content changes.
 */

import { ref, computed, nextTick, onMounted } from "vue";
import type { ShallowRef, Ref } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * Checks if a given node has any significant, non-comment, non-empty children.
 * @param node The DOM node to check.
 * @returns True if the node has significant content, false otherwise.
 */
const hasSignificantContent = (node: Node | undefined | null): boolean => {
  if (!node) return false;

  // Node types: 1 (Element), 3 (Text), 8 (Comment)
  if (node.nodeType === Node.COMMENT_NODE) {
    return false;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return !isEmpty(node?.textContent?.trim());
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    for (const childNode of Array.from(node.childNodes)) {
      if (hasSignificantContent(childNode)) {
        return true;
      }
    }
    return !isEmpty(node?.textContent?.trim());
  }

  return false;
};

// -----------------------------------------------------------------------------

/**
 * Reactively track whether a component template ref contains significant DOM
 * content. Watches for mutations (teleported content, dynamic rendering) and
 * performs an initial check on mount.
 *
 * @param templateRef A template ref pointing to a Vue component whose `$el`
 *   should be observed.
 * @returns A reactive `visible` ref that is `true` when the element contains
 *   significant content.
 */
export function useContentVisibility(
  templateRef: Readonly<ShallowRef<{ $el?: Node } | null>>
): Ref<boolean> {
  const visible = ref(false);

  const el = computed(
    () => (templateRef.value?.$el as HTMLElement | undefined) ?? null
  );

  const check = () => {
    visible.value = el.value ? hasSignificantContent(el.value) : false;
  };

  // --- side effects
  useMutationObserver(el, check, {
    childList: true,
    subtree: true
  });

  // Initial check on mount - needed because MutationObserver doesn't fire
  // for content that already exists when the observer starts
  onMounted(() => {
    nextTick(check);
  });

  return visible;
}
