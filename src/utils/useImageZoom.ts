import { ref, computed, onUnmounted } from "vue";
import type { Ref, CSSProperties } from "vue";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const WHEEL_ZOOM_SPEED = 0.01;

export function useImageZoom(imageRef: Ref<HTMLImageElement | null>) {
  const scale = ref(1);
  const origin = ref("center center");
  const isPinching = ref(false);

  const isZoomed = computed(() => scale.value > 1);

  const zoomStyle = computed<CSSProperties>(() => ({
    transform: `scale(${scale.value})`,
    transformOrigin: origin.value,
    transition: isPinching.value ? "none" : "transform 0.2s ease-out",
    cursor: isZoomed.value ? "zoom-out" : "zoom-in"
  }));

  function setOriginFromPoint(clientX: number, clientY: number) {
    const el = imageRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    origin.value = `${x}% ${y}%`;
  }

  function onImageClick(e: MouseEvent) {
    if (!imageRef.value) return;

    if (isZoomed.value) {
      scale.value = 1;
    } else {
      setOriginFromPoint(e.clientX, e.clientY);
      scale.value = 2;
    }
  }

  // Trackpad pinch fires as wheel events with ctrlKey
  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();

    isPinching.value = true;
    setOriginFromPoint(e.clientX, e.clientY);
    const delta = -e.deltaY * WHEEL_ZOOM_SPEED;
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta));

    requestAnimationFrame(() => {
      isPinching.value = false;
    });
  }

  // Mobile touch pinch
  let lastPinchDistance = 0;

  function getTouchDistance(t1: Touch, t2: Touch) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length < 2) return;
    e.preventDefault();

    const dist = getTouchDistance(e.touches[0], e.touches[1]);
    if (lastPinchDistance > 0) {
      const ratio = dist / lastPinchDistance;
      scale.value = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scale.value * ratio)
      );
    }
    lastPinchDistance = dist;
  }

  function onTouchEnd() {
    isPinching.value = false;
    lastPinchDistance = 0;
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length < 2) return;
    e.preventDefault();
    isPinching.value = true;
    lastPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);

    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    setOriginFromPoint(cx, cy);

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }

  function reset() {
    scale.value = 1;
    origin.value = "center center";
    isPinching.value = false;
    lastPinchDistance = 0;
  }

  onUnmounted(() => {
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  });

  return {
    zoomStyle,
    isZoomed,
    onImageClick,
    onWheel,
    onTouchStart,
    reset
  };
}
