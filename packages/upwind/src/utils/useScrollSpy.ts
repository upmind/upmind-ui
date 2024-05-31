import { ref, onBeforeMount, onBeforeUnmount } from "vue";
import { trimStart } from "lodash-es";
// -----------------------------------------------------------------------------

export const useScrollSpy = () => {
  const isScrolling = ref(false);
  const target = ref(null);

  function scrollIntoView(id, offset) {
    if (isScrolling.value) {
      console.warn("Already scrolling");
      return; // bail if already scrolling
    }

    id = trimStart(id, "#"); // remove hash

    const element = document.getElementById(id);

    if (!element) {
      console.warn(`Element with id "${id}" not found`);
      return; // bail if no element
    }

    target.value =
      element.getBoundingClientRect().top - offset + window.pageYOffset;

    isScrolling.value = true;

    window.scrollTo({
      top: target.value,
      behavior: "smooth",
    });
  }

  // ---
  //  Our scroll observer with  housekeeping
  function onScroll() {
    if (window.pageYOffset.toFixed() === target.value?.toFixed()) {
      isScrolling.value = false;
      target.value = null;
    } else {
      // console.debug("scrolling", {
      //   target: target.value?.toFixed(),
      //   window: window.pageYOffset.toFixed(),
      // });
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
