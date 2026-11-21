import React from "react";

interface CompatImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function Image({
  src,
  alt,
  fill,
  priority: _priority,
  unoptimized: _unoptimized,
  className = "",
  style,
  ...rest
}: CompatImageProps) {
  const fillClass = fill ? "h-full w-full object-cover" : "";
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${fillClass} ${className}`.trim()}
      style={style}
      {...rest}
    />
  );
}
