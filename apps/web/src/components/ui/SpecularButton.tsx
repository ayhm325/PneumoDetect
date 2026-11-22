import React from "react";
import clsx from "clsx";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { pdMotion } from "../../lib/motion";

/**
 * SpecularButton — historical public API, rebuilt for the Night Fig system.
 *
 * The previous WebGL specular shader has been retired: it was costly and its
 * colour presets were blue/white. The props are still accepted so existing
 * callers compile, but visual props now map onto design-token CSS variables
 * instead of shader uniforms. Motion comes from framer-motion springs.
 */
export type SpecularButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg";
  radius?: number;
  /** Optional surface colour override (any CSS colour / token). */
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  /** Optional text colour override (any CSS colour / token). */
  textColor?: string;
  /** Optional border colour override (any CSS colour / token). */
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  idleIntensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  glow?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  enableWebGL?: boolean;
};

const sizeClass: Record<NonNullable<SpecularButtonProps["size"]>, string> = {
  sm: "pd-btn--sm",
  md: "",
  lg: "pd-btn--lg",
  "icon-sm": "pd-btn--sm pd-btn--icon",
  "icon-md": "pd-btn--icon",
  "icon-lg": "pd-btn--lg pd-btn--icon",
};

export const SpecularButton = React.forwardRef<HTMLButtonElement, SpecularButtonProps>(
  function SpecularButton(
    {
      size = "md",
      radius,
      tint,
      textColor,
      lineColor,
      className,
      style,
      children,
      disabled,
      type = "button",
      /* retired shader props — accepted for API compatibility */
      tintOpacity: _tintOpacity,
      blur: _blur,
      baseColor: _baseColor,
      intensity: _intensity,
      idleIntensity: _idleIntensity,
      shineSize: _shineSize,
      shineFade: _shineFade,
      thickness: _thickness,
      glow: _glow,
      speed: _speed,
      followMouse: _followMouse,
      proximity: _proximity,
      autoAnimate: _autoAnimate,
      enableWebGL = false,
      ...rest
    },
    ref,
  ) {
    const reduceMotion = useReducedMotion();
    const isIcon = size.startsWith("icon");

    const overrides: React.CSSProperties = {
      ...(tint ? { background: tint } : null),
      ...(textColor ? { color: textColor } : null),
      ...(lineColor ? { borderColor: lineColor } : null),
      ...(radius !== undefined && !isIcon && !/pd-btn--(primary|outline|tertiary)/.test(className || "")
        ? { borderRadius: radius }
        : null),
      ...style,
    };

    const motionProps = rest as unknown as HTMLMotionProps<"button">;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        className={clsx("pd-btn", sizeClass[size], className)}
        style={overrides}
        whileHover={disabled || reduceMotion ? undefined : { y: -2 }}
        whileTap={disabled || reduceMotion ? undefined : { scale: 0.975 }}
        transition={pdMotion.press}
        {...motionProps}
      >
        {enableWebGL && <span aria-hidden="true" className="specular-button__light pointer-events-none hidden" />}
        {children}
      </motion.button>
    );
  },
);

export default SpecularButton;
