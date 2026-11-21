"use client";
import React, { useState } from "react";
import styles from "./ChatInput.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function ChatInput({ onSend }) {
  const t = useTranslations("doctorChat");
  const [msg, setMsg] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (msg.trim()) {
      onSend(msg);
      setMsg("");
    }
  };

  return (
    <form className={styles.inputForm} onSubmit={handleSend}>
      <input
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={t("messageInput")}
        className={styles.input}
      />
      <button type="submit" className={styles.sendBtn}>
        {t("actions.send")}
      </button>
    </form>
  );
}