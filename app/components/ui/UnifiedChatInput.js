"use client";
import React, { useState } from "react";
import styles from "./UnifiedChatInput.module.css";

export default function UnifiedChatInput({ onSend, placeholder = "اكتب رسالة...", buttonLabel = "إرسال", disabled = false }) {
  const [msg, setMsg] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (msg.trim() && !disabled) {
      onSend(msg);
      setMsg("");
    }
  };

  return (
    <form className={styles["unified-chat-input-form"]} onSubmit={handleSend}>
      <input
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={placeholder}
        className={styles["unified-chat-input"]}
        disabled={disabled}
      />
      <button type="submit" className={styles["unified-chat-send-btn"]} disabled={disabled}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 20L21 12L3 4V10L15 12L3 14V20Z" fill="currentColor" />
          </svg>
          {buttonLabel}
        </span>
      </button>
    </form>
  );
}
