import { CheckCheckIcon, CheckIcon, CircleAlertIcon, ClockIcon } from "lucide-react";
import React from "react";
import type { MessageDeliveryStatus } from "./chatUtils";

export interface MessageStatusIconProps {
  status?: MessageDeliveryStatus;
  className?: string;
}

export function MessageStatusIcon({ status = "sent", className = "" }: MessageStatusIconProps) {
  if (status === "sending") {
    return <ClockIcon size={12} strokeWidth={1.7} className={`opacity-70 ${className}`} aria-label="Sending" />;
  }
  if (status === "failed") {
    return (
      <CircleAlertIcon
        size={14}
        strokeWidth={1.7}
        className={`text-[var(--pd-coral)] ${className}`}
        aria-label="Failed"
      />
    );
  }
  if (status === "read") {
    return (
      <CheckCheckIcon
        size={14}
        strokeWidth={1.7}
        className={`text-[var(--pd-acid)] ${className}`}
        aria-label="Read"
      />
    );
  }
  if (status === "delivered") {
    return <CheckCheckIcon size={14} strokeWidth={1.7} className={`opacity-85 ${className}`} aria-label="Delivered" />;
  }
  return <CheckIcon size={12} strokeWidth={1.7} className={`opacity-80 ${className}`} aria-label="Sent" />;
}
export default MessageStatusIcon;
