import { ref, onBeforeMount, onBeforeUnmount } from "vue";

// -----------------------------------------------------------------------------

export const useScrollSpy = () => {
  const isScrolling = ref(false);
  const target = ref(null);

  function scrollIntoView(id, offset) {
    const element = document.getElementById(id);

    if (!element) return; // bail if no element

    target.value = element.getBoundingClientRect().top - offset;

    const offsetPosition = (target.value + window.pageYOffset).toFixed();

    isScrolling.value = true;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }

  // ---
  //  Our scroll observer with  housekeeping
  function onScroll() {
    if (window.pageYOffset.toFixed() === target.value?.toFixed()) {
      isScrolling.value = false;
      target.value = null;
    }
  }

  onBeforeMount(() => {
    window.addEventListener("scroll", onScroll);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", onScroll);
  });

  // ---

  return {
    isScrolling,
    scrollIntoView,
  };
};
