import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/stores/authStore";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";

interface ChatSummary {
  id: string;
  doctor?: { fullName?: string };
  patient?: { fullName?: string };
}

interface ChatMsg {
  id: string;
  sender: string;
  text?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt?: string;
}

export function ChatPage() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(false);

  const listEndpoint =
    user?.role === "doctor"
      ? "/api/chat/doctor"
      : user?.role === "admin"
        ? "/api/chat/admin"
        : "/api/chat/patient";

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ["chats", user?.role],
    queryFn: () => apiRequest<{ chats?: ChatSummary[] } | ChatSummary[]>(listEndpoint),
    enabled: Boolean(user),
  });

  const chats: ChatSummary[] = Array.isArray(chatsData)
    ? chatsData
    : chatsData?.chats || [];

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    let mounted = true;
    apiRequest<{ messages?: ChatMsg[] } | ChatMsg[]>(`/api/chat/${activeChatId}/messages`)
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.messages || [];
        setMessages(list);
      })
      .catch(() => {});

    const socket = getSocket();
    socket.emit("join", activeChatId);

    const onMessage = (msg: ChatMsg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    const onTyping = (payload: { userId?: string; typing?: boolean }) => {
      if (payload.userId !== user?.id) setTypingUser(Boolean(payload.typing));
    };

    socket.on("message", onMessage);
    socket.on("typing", onTyping);

    return () => {
      mounted = false;
      socket.emit("leave", activeChatId);
      socket.off("message", onMessage);
      socket.off("typing", onTyping);
    };
  }, [activeChatId, user?.id]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !text.trim()) return;
    const socket = getSocket();
    socket.emit("message", {
      chatId: activeChatId,
      text: text.trim(),
      clientKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    setText("");
  };

  if (isLoading) return <LoadingState />;
  if (chats.length === 0) {
    return (
      <EmptyState
        title={isAr ? "لا توجد محادثات" : "No chats available"}
        description={isAr ? "ستظهر محادثاتك الطبية هنا." : "Your clinical conversations will appear here."}
      />
    );
  }

  return (
    <div className="grid h-[75vh] gap-4 md:grid-cols-[260px_1fr]">
      <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 px-2 text-sm font-bold">{isAr ? "المحادثات" : "Conversations"}</h2>
        <div className="space-y-1">
          {chats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveChatId(c.id)}
              className={`w-full rounded-xl px-3 py-2 text-start text-sm font-medium ${
                activeChatId === c.id
                  ? "bg-sky-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {c.doctor?.fullName || c.patient?.fullName || c.id.slice(0, 8)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.sender === user?.role
                  ? "ms-auto bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typingUser && (
            <p className="text-xs italic text-slate-400">
              {isAr ? "يكتب الآن..." : "Typing..."}
            </p>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (activeChatId) getSocket().emit("typing", { chatId: activeChatId, typing: Boolean(e.target.value) });
            }}
            placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            {isAr ? "إرسال" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
