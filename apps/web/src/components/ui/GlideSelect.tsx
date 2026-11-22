import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";

export interface GlideSelectOption {
  value: string;
  label: ReactNode;
  tag?: string;
}

export interface GlideSelectProps {
  options?: (string | GlideSelectOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: GlideSelectOption) => void;
  placeholder?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  menuWidth?: number;
  fullWidth?: boolean;
  placement?: "top" | "bottom";
  align?: "left" | "right";
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  id?: string;
  name?: string;
}

type Phase = "closed" | "open" | "closing";

const SIZES: Record<string, { chip: number; row: number; font: number }> = {
  sm: { chip: 32, row: 28, font: 12 },
  md: { chip: 40, row: 34, font: 13 },
  lg: { chip: 46, row: 40, font: 14 },
};
const PAD = 4;
const GAP = 1;
const MENU_GAP = 6;
const DEFAULT_OPTIONS: (string | GlideSelectOption)[] = ["One", "Two", "Three"];
const STYLE = "@keyframes gs-swap{from{opacity:.6;filter:blur(2px)}}";

const norm = (o: string | GlideSelectOption): GlideSelectOption =>
  typeof o === "string" ? { value: o, label: o } : o;
const textOf = (it: GlideSelectOption) =>
  typeof it.label === "string" ? it.label : it.value;
const typeaheadIndex = (items: GlideSelectOption[], from: number, ch: string) => {
  const n = items.length;
  for (let s = 1; s <= n; s++) {
    const k = (from + s) % n;
    if (textOf(items[k]).toLowerCase().startsWith(ch)) return k;
  }
  return -1;
};

export const GlideSelect: React.FC<GlideSelectProps> = ({
  options = DEFAULT_OPTIONS,
  value: controlled,
  defaultValue,
  onChange,
  placeholder = "Select...",
  showTags = false,
  accentColor = "var(--color-primary)",
  surfaceColor = "var(--ui-surface-elevated)",
  highlightColor = "var(--ui-surface-2)",
  textColor = "var(--ui-foreground)",
  size = "md",
  radius = 12,
  menuWidth = 220,
  fullWidth = false,
  placement = "bottom",
  align = "left",
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  ariaLabel = "Select option",
  className = "",
  id,
  name,
}) => {
  const uid = useId();
  const items = options.map(norm);
  const { chip: chipH, row: rowH, font } = SIZES[size] || SIZES.md;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(
    () => defaultValue ?? items[0]?.value ?? ""
  );
  const val = isControlled ? controlled! : internal;
  const selectedIdx = items.findIndex((o) => String(o.value) === String(val));
  const selected = selectedIdx >= 0 ? items[selectedIdx] : undefined;

  const [phase, setPhase] = useState<Phase>("closed");
  const [hl, setHl] = useState(-1);
  const [pillReady, setPillReady] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastRect = useRef<{ y: number; h: number } | null>(null);
  const closeT = useRef<number | undefined>(undefined);
  const dragMoved = useRef(false);
  const isOpen = phase === "open";
  const top = placement === "top";

  const clearTimer = useCallback(() => {
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = undefined;
    }
  }, []);
  const close = useCallback(() => {
    clearTimer();
    setPhase((p) => (p === "open" ? "closing" : p));
  }, [clearTimer]);
  const open = (initial?: number) => {
    if (disabled || !items.length) return;
    clearTimer();
    if (!rememberPosition) lastRect.current = null;
    setPillReady(false);
    setHl(initial ?? (selectedIdx >= 0 ? selectedIdx : 0));
    setPhase("open");
  };
  const commit = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (!isControlled) setInternal(it.value);
    onChange?.(it.value, it);
    close();
    btnRef.current?.focus();
  };

  useEffect(() => {
    if (phase !== "closing") return;
    const t = window.setTimeout(
      () => setPhase("closed"),
      Math.max(120, popDuration * 0.72)
    );
    closeT.current = t;
    return () => clearTimeout(t);
  }, [phase, popDuration]);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el || phase === "closed") return;
    const enter = phase === "open";
    const dy = (top ? 1 : -1) * (enter ? 6 : 4);
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      enter
        ? [
            { opacity: 0, transform: `translateY(${dy}px) scale(.96)` },
            { opacity: 1, transform: "none" },
          ]
        : [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: `translateY(${dy}px) scale(.97)` },
          ],
      {
        duration: enter ? popDuration : Math.max(110, popDuration * 0.65),
        easing: enter
          ? "cubic-bezier(.16,1,.3,1)"
          : "cubic-bezier(.4,0,1,1)",
        fill: "forwards",
      }
    );
  }, [phase, top, popDuration]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const row = rowRefs.current[hl];
    if (!pill || !row || phase !== "open") return;
    const next = { y: row.offsetTop, h: row.offsetHeight };
    const prev = lastRect.current;
    pill.getAnimations().forEach((a) => a.cancel());
    if (!pillReady || !prev) {
      const from = prev ?? next;
      pill.style.transform = `translate3d(0,${next.y}px,0)`;
      pill.style.height = `${next.h}px`;
      if (prev && (prev.y !== next.y || prev.h !== next.h)) {
        pill.animate(
          [
            {
              transform: `translate3d(0,${from.y}px,0) scale(.97)`,
              height: `${from.h}px`,
            },
            {
              transform: `translate3d(0,${next.y}px,0) scale(1)`,
              height: `${next.h}px`,
            },
          ],
          {
            duration: glideDuration,
            easing: "cubic-bezier(.22,1,.36,1)",
          }
        );
      }
      setPillReady(true);
    } else if (prev.y !== next.y || prev.h !== next.h) {
      const stretch = Math.min(1.03, 1 + Math.abs(next.y - prev.y) / 900);
      pill.animate(
        [
          {
            transform: `translate3d(0,${prev.y}px,0) scale(1)`,
            height: `${prev.h}px`,
          },
          {
            transform: `translate3d(0,${(prev.y + next.y) / 2}px,0) scale(${stretch},${
              2 - stretch
            })`,
            height: `${next.h}px`,
            offset: 0.45,
          },
          {
            transform: `translate3d(0,${next.y}px,0) scale(1)`,
            height: `${next.h}px`,
          },
        ],
        {
          duration: glideDuration,
          easing: "cubic-bezier(.2,1,.25,1)",
        }
      );
      pill.style.transform = `translate3d(0,${next.y}px,0)`;
      pill.style.height = `${next.h}px`;
    }
    lastRect.current = next;
  }, [hl, phase, pillReady, glideDuration]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [isOpen, close]);

  const rowAtY = (clientY: number) => {
    for (let i = 0; i < items.length; i++) {
      const r = rowRefs.current[i]?.getBoundingClientRect();
      if (r && clientY >= r.top && clientY <= r.bottom) return i;
    }
    return -1;
  };

  const onTriggerPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    if (isOpen) {
      close();
      return;
    }
    open();
    dragMoved.current = false;
    const sy = e.clientY;
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientY - sy) > 5) dragMoved.current = true;
      if (dragMoved.current) {
        const i = rowAtY(ev.clientY);
        if (i >= 0) setHl(i);
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (dragMoved.current) {
        const i = rowAtY(ev.clientY);
        if (i >= 0) commit(i);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const step = (d: number) =>
    setHl((h) => ((h < 0 ? 0 : h) + d + items.length) % items.length);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || !items.length) return;
    const k = e.key;
    if (!isOpen) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        open();
      } else if (k.length === 1 && /\S/.test(k)) {
        const m = typeaheadIndex(items, selectedIdx, k.toLowerCase());
        if (m >= 0) {
          if (!isControlled) setInternal(items[m].value);
          onChange?.(items[m].value, items[m]);
        }
      }
      return;
    }
    if (k === "ArrowDown") {
      e.preventDefault();
      step(1);
    } else if (k === "ArrowUp") {
      e.preventDefault();
      step(-1);
    } else if (k === "Home") {
      e.preventDefault();
      setHl(0);
    } else if (k === "End") {
      e.preventDefault();
      setHl(items.length - 1);
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (hl >= 0) commit(hl);
    } else if (k === "Escape" || k === "Tab") {
      if (k === "Escape") e.preventDefault();
      close();
    } else if (k.length === 1 && /\S/.test(k)) {
      const m = typeaheadIndex(items, hl, k.toLowerCase());
      if (m >= 0) setHl(m);
    }
  };

  const listId = `${uid}-l`;
  const optId = (i: number) => `${uid}-o-${i}`;
  const itemR = Math.max(4, radius - 3);
  const vars = {
    "--gs-surf": surfaceColor,
    "--gs-hi": highlightColor,
    "--gs-txt": textColor,
    "--gs-acc": accentColor,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`${fullWidth ? "relative block w-full" : "relative inline-block"} select-none ${className}`}
      style={{
        ...vars,
        fontFamily: "var(--font-sans, inherit)",
      }}
    >
      <style>{STYLE}</style>
      {name ? <input type="hidden" name={name} value={val} /> : null}
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={phase !== "closed" ? listId : undefined}
        aria-activedescendant={isOpen && hl >= 0 ? optId(hl) : undefined}
        onPointerDown={onTriggerPointerDown}
        onKeyDown={onKeyDown}
        className={`inline-flex items-center justify-between gap-2.5 px-3.5 font-medium border border-[var(--ui-border-strong)] shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
          fullWidth ? "w-full" : ""
        }`}
        style={{
          height: chipH,
          borderRadius: radius,
          fontSize: font,
          background: "var(--gs-surf)",
          color: "var(--gs-txt)",
        }}
      >
        <span
          key={selected?.value ?? "__empty"}
          className="inline-flex items-center gap-2 truncate"
          style={{ animation: "gs-swap 180ms cubic-bezier(.22,1,.36,1)" }}
        >
          <span className={selected ? "truncate" : "opacity-55 truncate"}>
            {selected ? selected.label : placeholder}
          </span>
          {showTags && selected?.tag && (
            <span
              className="text-[0.72em] font-normal px-1.5 py-px rounded"
              style={{
                background:
                  "color-mix(in oklab, var(--gs-txt) 10%, transparent)",
                color: "color-mix(in oklab, var(--gs-txt) 68%, transparent)",
              }}
            >
              {selected.tag}
            </span>
          )}
        </span>
        <span
          className="inline-flex shrink-0 opacity-60 transition-transform duration-200"
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
          }}
        >
          <FaChevronDown className="w-3 h-3" aria-hidden="true" />
        </span>
      </button>

      {phase !== "closed" && (
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          onPointerMove={(e) => {
            const i = rowAtY(e.clientY);
            if (i >= 0 && i !== hl) setHl(i);
          }}
          className="absolute z-50 flex flex-col border border-[var(--ui-border-strong)] shadow-[var(--shadow-lift)] max-h-72 overflow-y-auto"
          style={{
            width: fullWidth ? "100%" : menuWidth,
            minWidth: menuWidth,
            padding: PAD,
            gap: GAP,
            borderRadius: radius,
            background: "var(--gs-surf)",
            color: "var(--gs-txt)",
            [top ? "bottom" : "top"]: `calc(100% + ${MENU_GAP}px)`,
            [align]: 0,
            transformOrigin: `${top ? "bottom" : "top"} ${align}`,
            pointerEvents: phase === "closing" ? "none" : "auto",
          }}
        >
          <div
            ref={pillRef}
            aria-hidden
            className="absolute pointer-events-none top-0"
            style={{
              left: PAD,
              right: PAD,
              borderRadius: itemR,
              background: "var(--gs-hi)",
              opacity: pillReady && hl >= 0 ? 1 : 0,
              transition: "opacity 90ms ease",
              willChange: "transform,height",
            }}
          />
          {items.map((it, i) => {
            const isSel = i === selectedIdx;
            const isHi = i === hl;
            return (
              <button
                key={it.value}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                id={optId(i)}
                type="button"
                role="option"
                aria-selected={isSel}
                onPointerEnter={() => setHl(i)}
                onClick={() => commit(i)}
                className="relative z-10 flex items-center justify-between gap-2 px-2.5 text-start font-medium border-0 bg-transparent cursor-pointer focus:outline-none"
                style={{
                  height: rowH,
                  borderRadius: itemR,
                  fontSize: font,
                  color: "var(--gs-txt)",
                  opacity: isHi || isSel ? 1 : 0.82,
                  transition: "opacity 100ms ease",
                }}
              >
                <span className="truncate">{it.label}</span>
                <span className="inline-flex items-center gap-1.5 shrink-0">
                  {showTags && it.tag && (
                    <span
                      className="text-[0.75em] font-normal"
                      style={{
                        color:
                          "color-mix(in oklab, var(--gs-txt) 55%, transparent)",
                      }}
                    >
                      {it.tag}
                    </span>
                  )}
                  <span
                    className="inline-flex w-3.5 justify-center transition-all duration-150"
                    style={{
                      color: "var(--gs-acc)",
                      opacity: isSel ? 1 : 0,
                      transform: isSel ? "scale(1)" : "scale(.5)",
                      transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    <FaCheck className="w-3 h-3" aria-hidden="true" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlideSelect;
