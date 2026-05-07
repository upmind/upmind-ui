import { ref, computed, onUnmounted } from "vue";
import type { Ref, CSSProperties } from "vue";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const CLICK_ZOOM_SCALE = 2;
const WHEEL_ZOOM_SPEED = 0.01;
const DRAG_THRESHOLD = 5;

export function useImageZoom(imageRef: Ref<HTMLImageElement | null>) {
  const scale = ref(1);
  const translate = ref({ x: 0, y: 0 });
  const isPinching = ref(false);
  const isDragging = ref(false);

  const isZoomed = computed(() => scale.value > 1);

  const zoomStyle = computed<CSSProperties>(() => ({
    transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scale.value})`,
    transformOrigin: "center center",
    transition:
      isPinching.value || isDragging.value ? "none" : "transform 0.2s ease-out",
    cursor: isZoomed.value
      ? isDragging.value
        ? "grabbing"
        : "grab"
      : "zoom-in",
    willChange: "transform"
  }));

  function getBaseRect() {
    const el = imageRef.value;
    if (!el) return { cx: 0, cy: 0, w: 0, h: 0 };
    const rect = el.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2 - translate.value.x,
      cy: rect.top + rect.height / 2 - translate.value.y,
      w: rect.width / scale.value,
      h: rect.height / scale.value
    };
  }

  function clampTranslate(tx: number, ty: number, s: number) {
    const { w, h } = getBaseRect();
    const maxX = ((s - 1) * w) / 2;
    const maxY = ((s - 1) * h) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, tx)),
      y: Math.max(-maxY, Math.min(maxY, ty))
    };
  }

  // Zoom to newScale while keeping screen point (px, py) under the cursor
  function zoomAtPoint(newScale: number, px: number, py: number) {
    const { cx, cy } = getBaseRect();
    const ratio = newScale / scale.value;
    const tx = px - cx - (px - cx - translate.value.x) * ratio;
    const ty = py - cy - (py - cy - translate.value.y) * ratio;
    scale.value = newScale;
    translate.value =
      newScale <= 1 ? { x: 0, y: 0 } : clampTranslate(tx, ty, newScale);
  }

  function onImageClick(e: MouseEvent) {
    if (isDragging.value) return;
    if (!imageRef.value) return;

    if (isZoomed.value) {
      scale.value = 1;
      translate.value = { x: 0, y: 0 };
    } else {
      zoomAtPoint(CLICK_ZOOM_SCALE, e.clientX, e.clientY);
    }
  }

  // Drag to pan (mouse)
  let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };

  function onMouseMove(e: MouseEvent) {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (!isDragging.value) {
      if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
      isDragging.value = true;
    }

    translate.value = clampTranslate(
      dragStart.tx + dx,
      dragStart.ty + dy,
      scale.value
    );
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    requestAnimationFrame(() => {
      isDragging.value = false;
    });
  }

  function onMouseDown(e: MouseEvent) {
    if (!isZoomed.value) return;
    e.preventDefault();
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      tx: translate.value.x,
      ty: translate.value.y
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  // Trackpad pinch fires as wheel events with ctrlKey
  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    isPinching.value = true;

    const delta = -e.deltaY * WHEEL_ZOOM_SPEED;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, scale.value + delta)
    );
    zoomAtPoint(newScale, e.clientX, e.clientY);

    requestAnimationFrame(() => {
      isPinching.value = false;
    });
  }

  // Mobile touch: pinch to zoom, single-finger drag to pan
  let lastPinchDistance = 0;
  let touchDragStart = { x: 0, y: 0, tx: 0, ty: 0 };

  function getTouchDistance(t1: Touch, t2: Touch) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length >= 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (lastPinchDistance > 0) {
        const ratio = dist / lastPinchDistance;
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scale.value * ratio)
        );
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAtPoint(newScale, cx, cy);
      }
      lastPinchDistance = dist;
      return;
    }

    if (e.touches.length === 1 && isZoomed.value) {
      e.preventDefault();
      const t = e.touches[0];
      translate.value = clampTranslate(
        touchDragStart.tx + (t.clientX - touchDragStart.x),
        touchDragStart.ty + (t.clientY - touchDragStart.y),
        scale.value
      );
    }
  }

  function onTouchEnd() {
    isPinching.value = false;
    isDragging.value = false;
    lastPinchDistance = 0;
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length >= 2) {
      e.preventDefault();
      isPinching.value = true;
      lastPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && isZoomed.value) {
      const t = e.touches[0];
      isDragging.value = true;
      touchDragStart = {
        x: t.clientX,
        y: t.clientY,
        tx: translate.value.x,
        ty: translate.value.y
      };
    } else {
      return;
    }

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }

  function reset() {
    scale.value = 1;
    translate.value = { x: 0, y: 0 };
    isPinching.value = false;
    isDragging.value = false;
    lastPinchDistance = 0;
  }

  onUnmounted(() => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  });

  return {
    zoomStyle,
    isZoomed,
    onImageClick,
    onMouseDown,
    onWheel,
    onTouchStart,
    reset
  };
}
