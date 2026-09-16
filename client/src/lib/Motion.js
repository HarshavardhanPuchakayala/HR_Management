import gsap from "gsap";

/**
 * Check whether the user has requested reduced motion.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate page content into view.
 */
export function pageEnter({
  header,
  stagger,
  staggerAmount = 0.06,
}) {
  // Respect the user's reduced-motion preference.
  if (prefersReducedMotion()) {
    if (header) {
      gsap.set(header, {
        opacity: 1,
        y: 0,
      });
    }

    if (stagger && stagger.length) {
      gsap.set(stagger, {
        opacity: 1,
        y: 0,
      });
    }

    return gsap.timeline();
  }

  const tl = gsap.timeline({
    defaults: {
      ease: "power3.out",
    },
  });

  if (header) {
    tl.fromTo(
      header,
      {
        opacity: 0,
        y: 14,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        clearProps: "opacity,transform",
      }
    );
  }

  if (stagger && stagger.length) {
    tl.fromTo(
      stagger,
      {
        opacity: 0,
        y: 16,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: staggerAmount,
        clearProps: "opacity,transform",
      },
      header ? "-=0.25" : 0
    );
  }

  return tl;
}

/**
 * Animate a number counting up to `value`
 * inside the given DOM node.
 */
export function countUp(node, value, opts = {}) {
  if (!node) return;

  const end = Number(value) || 0;

  // If reduced motion is enabled, show the final value immediately.
  if (prefersReducedMotion()) {
    node.textContent = end.toLocaleString(
      opts.locale ?? "en-IN"
    );

    return;
  }

  const target = {
    val: 0,
  };

  return gsap.to(target, {
    val: end,

    duration: opts.duration ?? 1.1,

    ease: "power2.out",

    onUpdate: () => {
      node.textContent = Math.round(target.val).toLocaleString(
        opts.locale ?? "en-IN"
      );
    },

    // Guarantee the exact final value.
    onComplete: () => {
      node.textContent = end.toLocaleString(
        opts.locale ?? "en-IN"
      );
    },
  });
}

export function movePill(pillNode, { top, height }, opts = {}) {
  if (!pillNode) return;
 
  if (prefersReducedMotion() || opts.snap) {
    gsap.set(pillNode, { y: top, height, opacity: 1 });
    return;
  }
 
  gsap.to(pillNode, {
    y: top,
    height,
    opacity: 1,
    duration: 0.4,
    ease: "power3.out",
    overwrite: "auto",
  });
}