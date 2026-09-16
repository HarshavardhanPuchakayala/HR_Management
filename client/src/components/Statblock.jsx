import { useEffect, useRef } from "react";
import { countUp } from "../lib/Motion.js";

const TONES = {
  coral: "bg-coral text-white",
  mint: "bg-mint text-ink",
  amber: "bg-amber text-ink",
  ink: "bg-ink text-white",
};

/**
 * A single flat-color stat block. Give each block on a page a different
 * tone so the strip reads as a set of distinct signals, not identical tiles.
 */
const StatBlock = ({ label, value, icon: Icon, tone = "ink", suffix = "" }) => {
  const numberRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") return;

    const tween = countUp(numberRef.current, value);

    // Kill the tween on unmount/re-run so a StrictMode double-invoke can't
    // leave two tweens fighting over the same text node.
    return () => tween?.kill();
  }, [value]);

  return (
    <div className={`stat-block rounded-xl2 p-5 ${TONES[tone] || TONES.ink}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">
          {label}
        </p>
        {Icon && <Icon size={18} className="shrink-0 opacity-70" />}
      </div>

      <p className="mt-3 font-display text-3xl font-semibold">
        {typeof value === "number" ? <span ref={numberRef}>0</span> : value}
        {suffix}
      </p>
    </div>
  );
};

export default StatBlock;