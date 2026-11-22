import React from "react";
import { Button } from "./Button";

export default function HoloButton({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <Button variant={variant} className={className} {...props}>
      {children}
    </Button>
  );
}
