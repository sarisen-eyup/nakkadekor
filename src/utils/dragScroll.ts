/**
 * Universal Bidirectional Mouse Drag-to-Scroll & Horizontal Wheel Utility
 * 
 * Enables fluid click-and-drag scrolling both vertically and horizontally
 * across scrollable containers (modals, sidebars, tables, tab bars, dropdowns, swatch bars).
 * Does NOT hijack the global browser window scroll or interfere with interactive buttons/sliders.
 */

export interface ScrollTargets {
  targetX: HTMLElement | null;
  targetY: HTMLElement | null;
}

// Check if mouse event occurred directly on native scrollbar tracks
function isClickOnScrollbar(el: HTMLElement, e: MouseEvent): boolean {
  const rect = el.getBoundingClientRect();
  // Vertical scrollbar on right
  if (el.scrollHeight > el.clientHeight && e.clientX >= rect.left + el.clientWidth) {
    return true;
  }
  // Horizontal scrollbar on bottom
  if (el.scrollWidth > el.clientWidth && e.clientY >= rect.top + el.clientHeight) {
    return true;
  }
  return false;
}

/**
 * Finds the nearest scrollable container ancestor(s) in X and Y directions.
 */
export function findScrollTargets(startEl: HTMLElement | null, e?: MouseEvent): ScrollTargets {
  let targetX: HTMLElement | null = null;
  let targetY: HTMLElement | null = null;
  let current: HTMLElement | null = startEl;

  // Check if click started inside an opt-out element
  while (current && current !== document.body && current !== document.documentElement) {
    if (current.getAttribute("data-no-drag-scroll") === "true") {
      return { targetX: null, targetY: null };
    }
    current = current.parentElement;
  }

  current = startEl;

  while (current && current !== document.body && current !== document.documentElement) {
    const tag = current.tagName.toLowerCase();

    // Do not hijack form inputs, sliders, or contenteditable
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "option") {
      return { targetX: null, targetY: null };
    }

    if (current.getAttribute("contenteditable") === "true") {
      return { targetX: null, targetY: null };
    }

    // If click was on a native scrollbar thumb/track, let browser handle it
    if (e && isClickOnScrollbar(current, e)) {
      return { targetX: null, targetY: null };
    }

    // Check horizontal scrollability
    if (!targetX) {
      const explicitX = current.hasAttribute("data-drag-scroll") ||
        current.hasAttribute("data-drag-scroll-x") ||
        current.classList.contains("drag-scroll") ||
        current.classList.contains("drag-scroll-x") ||
        current.classList.contains("overflow-x-auto") ||
        current.classList.contains("overflow-x-scroll");

      if (explicitX && current.scrollWidth > current.clientWidth + 2) {
        targetX = current;
      } else {
        try {
          const style = window.getComputedStyle(current);
          if (
            (style.overflowX === "auto" || style.overflowX === "scroll") &&
            current.scrollWidth > current.clientWidth + 2
          ) {
            targetX = current;
          }
        } catch {
          // ignore
        }
      }
    }

    // Check vertical scrollability
    if (!targetY) {
      const explicitY = current.hasAttribute("data-drag-scroll") ||
        current.hasAttribute("data-drag-scroll-y") ||
        current.classList.contains("drag-scroll") ||
        current.classList.contains("drag-scroll-y") ||
        current.classList.contains("overflow-y-auto") ||
        current.classList.contains("overflow-y-scroll");

      if (explicitY && current.scrollHeight > current.clientHeight + 2) {
        targetY = current;
      } else {
        try {
          const style = window.getComputedStyle(current);
          if (
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            current.scrollHeight > current.clientHeight + 2
          ) {
            targetY = current;
          }
        } catch {
          // ignore
        }
      }
    }

    if (targetX && targetY) break;
    current = current.parentElement;
  }

  return { targetX, targetY };
}

let isGlobalInitialized = false;
let momentumRafId: number | null = null;

/**
 * Initializes global bidirectional drag-to-scroll and horizontal mousewheel listeners.
 * Seamlessly enables grab-and-drag scrolling on any container with overflow.
 */
export function initGlobalDragScroll() {
  if (isGlobalInitialized || typeof window === "undefined") return;
  isGlobalInitialized = true;

  let activeTargetX: HTMLElement | null = null;
  let activeTargetY: HTMLElement | null = null;
  let isStartedOnInteractive = false;

  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  let isDragging = false;
  let lastClientX = 0;
  let lastClientY = 0;
  let lastTime = 0;
  let velocityX = 0;
  let velocityY = 0;

  const cancelMomentum = () => {
    if (momentumRafId !== null) {
      cancelAnimationFrame(momentumRafId);
      momentumRafId = null;
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    // Only primary left button
    if (e.button !== 0) return;

    cancelMomentum();

    const target = e.target as HTMLElement | null;
    const { targetX, targetY } = findScrollTargets(target, e);

    // Only activate if an actual scrollable container was found!
    if (!targetX && !targetY) return;

    // Check if the click was directly on an interactive button, link, or custom button
    const interactiveParent = target?.closest("button, a, [role='button'], input, label, select");
    isStartedOnInteractive = !!interactiveParent;

    activeTargetX = targetX;
    activeTargetY = targetY;

    startX = e.clientX;
    startY = e.clientY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    startScrollLeft = targetX ? targetX.scrollLeft : 0;
    startScrollTop = targetY ? targetY.scrollTop : 0;

    isDragging = false;
    lastTime = performance.now();
    velocityX = 0;
    velocityY = 0;

    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp, { capture: true });
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!activeTargetX && !activeTargetY) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.hypot(dx, dy);

    // If click started on a button/interactive element, require deliberate drag (14px)
    // Otherwise standard 8px threshold
    const threshold = isStartedOnInteractive ? 14 : 8;

    if (!isDragging) {
      if (dist > threshold) {
        isDragging = true;
        if (activeTargetX) activeTargetX.classList.add("is-dragging");
        if (activeTargetY) activeTargetY.classList.add("is-dragging");
      }
    }

    if (isDragging) {
      e.preventDefault(); // Prevent text highlight

      if (activeTargetX) {
        activeTargetX.scrollLeft = startScrollLeft - dx;
      }

      if (activeTargetY) {
        activeTargetY.scrollTop = startScrollTop - dy;
      }

      // Track velocity for smooth flick momentum
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 8) {
        velocityX = (e.clientX - lastClientX) / dt;
        velocityY = (e.clientY - lastClientY) / dt;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        lastTime = now;
      }
    }
  };

  const onMouseUp = (_e: MouseEvent) => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp, { capture: true });

    const targetX = activeTargetX;
    const targetY = activeTargetY;

    if (targetX) targetX.classList.remove("is-dragging");
    if (targetY) targetY.classList.remove("is-dragging");

    if (isDragging) {
      // Suppress accidental click on buttons/cards/swatches after dragging
      const preventClickCapture = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      };

      window.addEventListener("click", preventClickCapture, { capture: true, once: true });
      setTimeout(() => {
        window.removeEventListener("click", preventClickCapture, { capture: true });
      }, 100);

      // Natural momentum / inertia deceleration
      const initialVx = velocityX;
      const initialVy = velocityY;

      if (Math.abs(initialVx) > 0.12 || Math.abs(initialVy) > 0.12) {
        let vx = initialVx * 14;
        let vy = initialVy * 14;
        const friction = 0.92;

        const momentumStep = () => {
          const speed = Math.hypot(vx, vy);
          if (speed < 0.35) {
            momentumRafId = null;
            return;
          }

          if (targetX && Math.abs(vx) > 0.2) {
            targetX.scrollLeft -= vx;
          }
          if (targetY && Math.abs(vy) > 0.2) {
            targetY.scrollTop -= vy;
          }

          vx *= friction;
          vy *= friction;
          momentumRafId = requestAnimationFrame(momentumStep);
        };

        momentumRafId = requestAnimationFrame(momentumStep);
      }
    }

    activeTargetX = null;
    activeTargetY = null;
    isDragging = false;
    isStartedOnInteractive = false;
  };

  // Convert vertical mouse wheel into horizontal scroll when hovering over purely horizontal strips/tab bars
  const onWheel = (e: WheelEvent) => {
    if (e.deltaY === 0) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Asla tablo, tablo hücreleri veya dikey listelerde fare tekerleğini (wheel) engelleme
    if (
      target.closest("table") || 
      target.closest("tbody") || 
      target.closest("thead") ||
      target.closest("[data-allow-native-scroll='true']") ||
      target.closest(".allow-native-scroll")
    ) {
      return;
    }

    const { targetX, targetY } = findScrollTargets(target);

    // If element can scroll horizontally, but NOT vertically (like tabs, chip rows)
    if (targetX && !targetY && targetX.scrollWidth > targetX.clientWidth + 2) {
      // Tablo içeren konteynerlerde dikey kaydırmayı yataya çevirme
      if (targetX.querySelector("table") || targetX.closest("table")) {
        return;
      }
      targetX.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  window.addEventListener("mousedown", onMouseDown, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: false });
}
