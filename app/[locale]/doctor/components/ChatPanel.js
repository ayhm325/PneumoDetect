"use client";
import React, { useMemo, useState } from "react";
import ChatList from "./ChatList";
import ChatMessage from "./ChatMessage";
import UnifiedChatInput from "@/app/components/ui/UnifiedChatInput";
import ChatAttachments from "./ChatAttachments";
import styles from "./ChatPanel.module.css";

import { useLocale, useTranslations } from "next-intl";
import { formatTime } from "@/app/lib/date";

export default function ChatPanel() {
  const locale = useLocale();
  const ui = useTranslations("ui");
  const t = useTranslations("doctorChat");

  const initialChats = useMemo(() => {
    const items = t.raw("items");
    if (!Array.isArray(items)) return [];

    return items.map((item, index) => {
      const patientName = item?.patientName || ui("placeholder");
      const messages = Array.isArray(item?.messages)
        ? item.messages.map((m, messageIndex) => ({
            id: messageIndex + 1,
            sender: messageIndex % 2 === 0 ? "patient" : "doctor",
            text: m?.text || ui("placeholder"),
            time: m?.time || ui("placeholder"),
          }))
        : [];

      return {
        id: index + 1,
        patient: {
          name: patientName,
          profileImage: "/default-patient.png",
        },
        messages,
      };
    });
  }, [t, ui]);

  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(() =>
    initialChats[0]?.id ? initialChats[0].id : null,
  );
  const [attachments, setAttachments] = useState([]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const handleSend = (msg) => {
    if (!selectedChatId) return;

    const nowIso = new Date().toISOString();
    const time = formatTime(
      nowIso,
      locale === "en" ? "en" : "ar",
      ui("placeholder"),
    );

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== selectedChatId) return chat;

        const nextId = (chat.messages?.length || 0) + 1;
        return {
          ...chat,
          messages: [
            ...(chat.messages || []),
            {
              id: nextId,
              sender: "doctor",
              text: msg,
              time,
            },
          ],
        };
      }),
    );
  };

  const handleAttach = (files) => {
    setAttachments([...attachments, ...files]);
  };

  return (
    <div className={styles.panel}>
      <ChatList
        chats={chats}
        selectedId={selectedChatId}
        onSelect={setSelectedChatId}
      />
      <div className={styles.chatWindow}>
        <div className={styles.messages}>
          {selectedChat?.messages?.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              patient={selectedChat.patient}
            />
          )) || <div>{t("selectChatPrompt")}</div>}
        </div>
        <ChatAttachments attachments={attachments} onAttach={handleAttach} />
        {/* Unified chat input for both doctor and patient */}
        <div className={styles.inputBar}>
          <UnifiedChatInput
            onSend={handleSend}
            placeholder={t("messageInput")}
            buttonLabel={t("actions.send")}
          />
        </div>
      </div>
    </div>
  );
}
