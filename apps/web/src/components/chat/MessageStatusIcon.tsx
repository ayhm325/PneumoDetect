import React from "react";
import { FaCheck, FaCheckDouble, FaClock, FaExclamationCircle } from "react-icons/fa";
import type { MessageDeliveryStatus } from "./chatUtils";

export interface MessageStatusIconProps {
  status?: MessageDeliveryStatus;
  className?: string;
}

export function MessageStatusIcon({ status = "sent", className = "" }: MessageStatusIconProps) {
  if (status === "sending") {
    return <FaClock className={`h-3 w-3 opacity-70 ${className}`} aria-label="Sending" />;
  }
  if (status === "failed") {
    return (
      <FaExclamationCircle
        className={`h-3.5 w-3.5 text-[var(--ui-danger)] ${className}`}
        aria-label="Failed"
      />
    );
  }
  if (status === "read") {
    return (
      <FaCheckDouble
        className={`h-3.5 w-3.5 text-sky-300 ${className}`}
        aria-label="Read"
      />
    );
  }
  if (status === "delivered") {
    return <FaCheckDouble className={`h-3.5 w-3.5 opacity-85 ${className}`} aria-label="Delivered" />;
  }
  return <FaCheck className={`h-3 w-3 opacity-80 ${className}`} aria-label="Sent" />;
}
export default MessageStatusIcon;
